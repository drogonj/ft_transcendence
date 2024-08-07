from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.views import View
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from .models import Match

User = get_user_model()

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


