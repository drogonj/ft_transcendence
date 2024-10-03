from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.views import View
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from asgiref.sync import sync_to_async, async_to_sync
import logging, sys, math, json
from channels.layers import get_channel_layer
from .models import Match
from friends.consumers import change_and_notify_user_status
from friends.consumers import user_lock, connected_users
from django.db import transaction
from urllib.parse import urlparse
import asyncio

User = get_user_model()
channel_layer = get_channel_layer()

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

@method_decorator(csrf_protect, name='dispatch')
class GetUserMatchesView(View):
    def get(self, request, user_id):

        if not user_id:
            return JsonResponse({'error': 'No target provided'}, status=400)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({'error': f'Target not found'}, status=404)

        matches = Match.objects.get_matches_by_user(user)
        response = []
        for match in matches:
            if match.player0 == user:
                player = match.player0
                opponent = match.player1
                self_score = match.score0
                opponent_score = match.score1
            else:
                player = match.player1
                opponent = match.player0
                self_score = match.score1
                opponent_score = match.score0
            response.append({
                'self_username': player.username,
                'self_id': player.id,
                'self_score': self_score,
                'opponent_username': opponent.username,
                'opponent_id': opponent.id,
                'opponent_score': opponent_score,
                'date': match.date.strftime('%m/%d/%Y %H:%M')
            })
        return JsonResponse({'matches': response})

#Handle Game Events View with Users
#Match is created in game_events_listener.py
@method_decorator(csrf_exempt, name='dispatch')
class HandleGameEventsView(View):
    @transaction.atomic
    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return HttpResponseBadRequest('Invalid JSON')

        if 'type' not in data or data['type'] != 'game_data':
            return HttpResponseBadRequest('Wrong type of data')
        if 'player0' not in data or 'player1' not in data:
            return HttpResponseBadRequest('Missing player data')

        try:
            player0 = User.objects.select_for_update().get(id=data['player0']['playerId'])
            player1 = User.objects.select_for_update().get(id=data['player1']['playerId'])
        except User.DoesNotExist:
            return JsonResponse({'error': 'Player not found'}, status=404)

        if data['reason'] == f'{player0.id}_disconnected':
            data['player0']['playerScore'] = -42
        elif data['reason'] == f'{player1.id}_disconnected':
            data['player1']['playerScore'] = -42

        player0_data = data['player0']
        player1_data = data['player1']
        try:
            tournament = data.get('tournament', False)
            match = Match.objects.create(
                player0=player0,
                player1=player1,
                score0=player0_data['playerScore'],
                score1=player1_data['playerScore'],
                winner=player0 if player0_data['playerScore'] > player1_data['playerScore'] else (player1 if player0_data['playerScore'] < player1_data['playerScore'] else None),
                tournament=tournament
            )
            match.save()
            async_to_sync(self.safe_operate)(player0, player1, match)

        except Exception as e:
            return JsonResponse({'error': f'Failed to store match data: {e}'}, status=500)

        return HttpResponse('Game event handled')

    async def safe_operate(self, player0, player1, match):
        async with user_lock:
            await self.updateUser(player0, player1, match)
    async def updateUser(self, player0, player1, match):
        await self.updatePlayerStats(player0, player1, match)
        await self.updatePlayerStats(player1, player0, match)

    async def updatePlayerStats(self, player, opponent, match):
        if player == match.winner:
            player.victories += 1
            player.trophies += 10
            player.tournaments_won += 1 if match.tournament else 0
        elif opponent == match.winner:
            player.defeats += 1
            if player.trophies - 10 >= 0:
                player.trophies -= 10
        total_matches = player.victories + player.defeats
        if total_matches > 0:
            player.winrate = round((player.victories / total_matches) * 100, 2)
        player_score = match.score0 if player == match.player0 else match.score1
        if player_score > 0:
            player.goals += player_score
        await sync_to_async(player.save)()
        #Display new stats
        #logger.info(f'{player.username} stats updated: {player.victories} victories, {player.defeats} defeats, {player.trophies} trophies, {player.tournaments_won} tournaments won, {player.goals} goals, {player.winrate}% winrate')

@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required, name='dispatch')
class user_statement_front(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        user = request.user
        state = data.get('state')

        if not user or state is None:
            return JsonResponse({'error': 'Missing data'}, status=400)

        if state not in ['local_game_started', 'local_game_ended']:
            return JsonResponse({'error': 'Invalid state'}, status=400)

        logger.info(f'Received: {data}')
        logger.info(f'Connected users: {connected_users}')

        async_to_sync(self.safe_operate)(user, state)

        return HttpResponse('OK')

    async def safe_operate(self, user, state):
        async with user_lock:
            await asyncio.sleep(0.1)
            # Check if user is connected, if not, tell the modification is not applied
            if user.id not in connected_users:
                return JsonResponse({'error': 'User not connected'}, status=400)
            try:
                await change_and_notify_user_status(channel_layer, user, 'in-game' if state == 'local_game_started' else 'online')
            except:
                return JsonResponse({'error': 'Failed to update user status'}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class user_statement_back(View):
    async def get(self, request):
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({'error': 'No user provided'}, status=400)
        try:
            user = await async_to_sync(User.objects.get)(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except:
            return JsonResponse({'error': 'Failed to get user status'}, status=500)

        #Send user statement
        return JsonResponse({'status': user.status})

    async def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        user_id = data.get('user_id')
        state = data.get('state')

        if not user_id or state is None:
            return JsonResponse({'error': 'Missing data'}, status=400)

        user_id = int(user_id)

        logger.info(f'Received: {data}')
        logger.info(f'Connected users: {connected_users}')

        states_list = ["remote_game_started", "remote_game_ended", "tournament_started", "tournament_ended", "matchmaking_started", "matchmaking_ended"]
        if state not in states_list:
            return JsonResponse({'error': 'Invalid state'}, status=400)

        async with user_lock:
            await asyncio.sleep(0.1)
            # Check if user is connected, if not, tell the modification is not applied
            if user_id not in connected_users:
                return JsonResponse({'error': 'User not connected'}, status=400)
            try:
                user = await User.objects.aget(id=user_id)
                if state == "remote_game_started":
                    await change_and_notify_user_status(channel_layer, user, 'in-game')
                elif state == "tournament_started":
                    await change_and_notify_user_status(channel_layer, user, 'tournament')
                elif state == "matchmaking_started":
                    await change_and_notify_user_status(channel_layer, user, 'matchmaking')
                else: # ["remote_game_ended", "tournament_ended", "matchmaking_ended"]
                    await change_and_notify_user_status(channel_layer, user, 'online')

                await user.asave()

            except User.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=404)
            except Exception as e:
                logger.info(f'--- ERROR: {e}')
                return JsonResponse({'error': 'Failed to update user status'}, status=500)

        return JsonResponse({'status': 'OK'})

@method_decorator(csrf_exempt, name='dispatch')
class add_won_tournament(View):
    async def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        user_id = data.get('user_id')
        if not user_id:
            return JsonResponse({'error': 'Missing data'}, status=400)

        async with user_lock:
            try:
                user = await User.objects.aget(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=404)
            except:
                return JsonResponse({'error': 'Failed to get user status'}, status=500)
            user.tournaments_won += 1
            await user.asave()

        return HttpResponse('OK')