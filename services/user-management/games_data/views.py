from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.views import View
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
from asgiref.sync import sync_to_async, async_to_sync
import logging, sys, math, json
from channels.layers import get_channel_layer
from .models import Match
from friends.consumers import change_and_notify_user_status
from friends.consumers import connected_users, user_lock, get_c_user, c_user, set_c_user_running_games
from django.db import transaction

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

        if 'type' not in data:
            return HttpResponseBadRequest('No type provided')
        if 'player0' not in data or 'player1' not in data:
            return HttpResponseBadRequest('Missing player data')

        try:
            player0 = User.objects.select_for_update().get(id=data['player0']['playerId'])
            player1 = User.objects.select_for_update().get(id=data['player1']['playerId'])
        except User.DoesNotExist:
            return JsonResponse({'error': 'Player not found'}, status=404)

        if data['type'] == 'game_started':
            set_c_user_running_games(player0.id, 1)
            set_c_user_running_games(player1.id, 1)
        elif data['type'] == 'game_data':
            # Set players score to -42 if they disconnected

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
                #Display player 0 new stats
                logger.info(f'{player0.username} stats updated: {player0.victories} victories, {player0.defeats} defeats, {player0.trophies} trophies, {player0.tournaments_won} tournaments won, {player0.goals} goals, {player0.winrate}% winrate')

            except Exception as e:
                return JsonResponse({'error': f'Failed to store match data: {e}'}, status=500)
        return HttpResponse('Game event handled')

    async def safe_operate(self, player0, player1, match):
        async with user_lock:
            await self.updateUser(player0, player1, match)
    async def updateUser(self, player0, player1, match):
        await self.updatePlayerStats(player0, player1, match)
        await self.updatePlayerStats(player1, player0, match)

        set_c_user_running_games(player0.id, -1)
        set_c_user_running_games(player1.id, -1)

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
