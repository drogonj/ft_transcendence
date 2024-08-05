from django.contrib.auth import get_user_model
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.views import View
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
import json, os, secrets, mimetypes, requests
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Friendship, FriendshipRequest
from django.db.models import Q

def send_friend_request_notification(to_user_id, from_user):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{to_user_id}',
        {
            'type': 'friend_request_notification',
            'id': from_user.id,
            'from_user': from_user.username,
            'avatar': from_user.profil_image.url,
        }
    )

def send_accepted_friendship_request_notification(to_user_id, from_user):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{to_user_id}',
        {
            'type': 'accepted_friendship_request_notification',
            'id': from_user.id,
            'from_user': from_user.username,
            'avatar': from_user.profil_image.url,
            'is_connected': from_user.is_connected,
        }
    )

def send_canceled_friendship_notification(to_user_id, from_user):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{to_user_id}',
        {
            'type': 'canceled_friendship_notification',
            'id': from_user.id,
            'from_user': from_user.username,
            'avatar': from_user.profil_image.url,
        }
    )

User = get_user_model()

@method_decorator(login_required, name='dispatch')
class GetFriendsView(View):
    def get(self, request):
        friends = Friendship.objects.get_friends(request.user)
        friends_info = []
        for friend in friends:
            friends_info.append({
                'id': friend.id,
                'username': friend.username,
                'avatar': friend.profil_image.url,
                'is_connected': friend.is_connected,
            })
        return JsonResponse({'friends': friends_info})

@method_decorator(login_required, name='dispatch')
class GetReceivedFriendshipRequestsView(View):
    def get(self, request):
        requests = FriendshipRequest.objects.get_received_friendship_requests(request.user)
        from_users = []
        for request in requests:
            from_users.append({
                'id': request.from_user.id,
                'username': request.from_user.username,
                'avatar': request.from_user.profil_image.url,
            })
        return JsonResponse({'requests': from_users})

@method_decorator(login_required, name='dispatch')
class AddFriendView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return HttpResponseBadRequest("Invalid JSON")

        user_id = data.get('id')
        if not user_id:
            return JsonResponse({'error': 'No target provided'}, status=400)

        if user_id == request.user.id:
            return JsonResponse({'error': 'What are you doing?'})

        try:
            to_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({'error': f'Target not found'}, status=404)

        # Check if a friendship request already exists
        if FriendshipRequest.objects.filter(from_user=request.user, to_user=to_user).exists():
            return JsonResponse({'message': 'Request already sent'}, status=400)

        if Friendship.objects.filter(from_user=request.user, to_user=to_user).exists():
            return JsonResponse({'message': 'You are already friend with this user'}, status=400)

        # Check if a friendship request was received from the target user
        if FriendshipRequest.objects.filter(from_user=to_user, to_user=request.user).exists():
            FriendshipRequest.objects.accept_friendship_request(to_user=request.user, from_user=to_user)
            send_accepted_friendship_request_notification(to_user.id, request.user)
            return JsonResponse({
                'message': 'friendship request accepted',
                'id': to_user.id,
                'avatar': to_user.profil_image.url,
                'is_connected': to_user.is_connected,
            })

        try:
            FriendshipRequest.objects.create(from_user=request.user, to_user=to_user)
            send_friend_request_notification(to_user.id, from_user=request.user)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

        return JsonResponse({'message': 'Invitation sent'}, status=200)

@method_decorator(login_required, name='dispatch')
class RemoveFriendView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            target = User.objects.get(id=data.get('friend_id'))
            Friendship.objects.cancel_friendship(request.user, target)
            send_canceled_friendship_notification(target.id, request.user)
            return JsonResponse({'message': 'friendship canceled'})
        except Exception:
            return HttpResponseBadRequest()

@method_decorator(login_required, name='dispatch')
class AcceptFriendshipRequest(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            from_user = User.objects.get(id=data.get('id'))
            FriendshipRequest.objects.accept_friendship_request(request.user, from_user)
            send_accepted_friendship_request_notification(from_user.id, request.user)
            return JsonResponse({
                'message': 'friendship request accepted',
                'username': from_user.username,
                'is_connected': from_user.is_connected,
            })
        except Exception:
            return HttpResponseBadRequest()

@method_decorator(login_required, name='dispatch')
class DeclineFriendshipRequest(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            from_user = User.objects.get(id=data.get('id'))
            FriendshipRequest.objects.cancel_friendship_request(request.user, from_user)
            return JsonResponse({'message': 'friendship request canceled'})
        except Exception:
            return HttpResponseBadRequest()

@login_required
def search_users(request):
    query = request.GET.get('q')
    if query:
        users = User.objects.filter(Q(username__icontains=query))

        user_data = []
        for user in users:
            # Vérifiez les demandes d'amitié et les amitiés existantes
            has_friendship_request = FriendshipRequest.objects.filter(
                from_user=request.user, to_user=user
            ).exists()
            has_friendship = Friendship.objects.filter(
                Q(from_user=request.user, to_user=user) |
                Q(from_user=user, to_user=request.user)
            ).exists()

            # Ajouter l'utilisateur seulement s'il n'est pas l'utilisateur actuel et si aucune amitié n'existe déjà
            if user.username != request.user.username and not has_friendship:
                user_data.append({
                    'username': user.username,
                    'id': user.id,
                    'avatar': user.profil_image.url,
                    'pending_request': has_friendship_request
                })
    else:
        user_data = []

    return JsonResponse({'users': user_data})

class GetAllUsersDataView(View):
	def get(self, request):
		users = User.objects.all()
		user_data = [
			{
				'username': user.username,
				'user_id': user.id,
				'avatar': user.profil_image.url if user.profil_image else None,
				'is_connected': user.is_connected,
			}
			for user in users
		]
		return JsonResponse({'users': user_data})

class GetOneUserDataView(View):
	def get(self, request, user_id):
		try:
			user = User.objects.get(id=user_id)
			user_data = {
				'username': user.username,
				'is_connected': user.is_connected,
			}
			return JsonResponse(user_data)
		except User.DoesNotExist:
			return JsonResponse({'error': 'User not found'}, status=404)