from django.contrib.auth import get_user_model
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.views import View
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
import json, os, secrets, mimetypes, requests
from .models import Friendship, FriendshipRequest

User = get_user_model()

@method_decorator(login_required, name='dispatch')
class GetFriendsView(View):
    def get(self, request):
        friends = Friendship.objects.get_friends(request.user)
        friends_info = []
        for friend in friends:
            friends_info.append({
                'username': friend.username,
                'profil_image': friend.profil_image.url,
                # Ajoutez d'autres informations pertinentes que vous souhaitez retourner
            })
        return JsonResponse({'friends': friends_info})

@method_decorator(csrf_exempt, name='dispatch')  # TODO: REMOVE THAT
@method_decorator(login_required, name='dispatch')
class AddFriendView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return HttpResponseBadRequest("Invalid JSON")

        username = data.get('username')
        if not username:
            return JsonResponse({'error': 'No target provided'}, status=400)

        try:
            to_user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({'error': f'Target not found: {username}'}, status=404)

        # Check if a friendship request already exists
        if FriendshipRequest.objects.filter(from_user=request.user, to_user=to_user).exists():
            return JsonResponse({'message': 'Request already sent'}, status=400)

        # Check if a friendship request was received from the target user
        if FriendshipRequest.objects.filter(from_user=to_user, to_user=request.user).exists():
            friendship_request = FriendshipRequest.objects.get(from_user=to_user, to_user=request.user)
            friendship_request.accept()
            return JsonResponse({'message': f'You are now friends with {to_user.username}'}, status=200)

        try:
            invitation = FriendshipRequest.objects.create(from_user=request.user, to_user=to_user)
            # TODO: REMOVE THAT
            invitation.accept()
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

        return JsonResponse({'message': 'Invitation sent'}, status=200)
