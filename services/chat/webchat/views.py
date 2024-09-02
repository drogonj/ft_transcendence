import json
from django.views import View
from django.http import JsonResponse, HttpResponseBadRequest
from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Message, PrivateMessage, InvitationToPlay, MuteList

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE', '')})

def serialize_queryset(queryset):
	return list(queryset.values())

def message_list(request):
	messages = Message.objects.all()
	private_messages = PrivateMessage.objects.all()

	combined_data = {
		'messages': serialize_queryset(messages),
		'private_messages': serialize_queryset(private_messages),
	}

	return JsonResponse(combined_data)

def invitations(request):
	invitations = InvitationToPlay.objects.all().values('invitationId', 'status', 'type', 'user_id', 'username', 'timestamp', 'receiver_id', 'receiver_username')
	return JsonResponse(list(invitations), safe=False)

def accept_invitation(request, invitationId):
	try:
		invitation = InvitationToPlay.objects.get(invitationId=invitationId)
		invitation.status = 'accepted'
		invitation.save() 
		return JsonResponse({'status': 'accepted'})
	except InvitationToPlay.DoesNotExist:
		return JsonResponse({'error': 'Invitation not found'}, status=404)

def decline_invitation(request, invitationId):
	try:
		invitation = InvitationToPlay.objects.get(invitationId=invitationId)
		invitation.status = 'declined'
		invitation.save() 
		return JsonResponse({'status': 'declined'})
	except InvitationToPlay.DoesNotExist:
		return JsonResponse({'error': 'Invitation not found'}, status=404)

def cancel_invitation(request, invitationId):
	try:
		invitation = InvitationToPlay.objects.get(invitationId=invitationId)
		invitation.status = 'cancelled'
		invitation.save() 
		return JsonResponse({'status': 'cancelled'})
	except InvitationToPlay.DoesNotExist:
		return JsonResponse({'error': 'Invitation not found'}, status=404)
	
def on_hold_invitation(request, invitationId):
	try:
		invitation = InvitationToPlay.objects.get(invitationId=invitationId)
		invitation.status = 'on-hold'
		invitation.save() 
		return JsonResponse({'status': 'on-hold'})
	except InvitationToPlay.DoesNotExist:
		return JsonResponse({'error': 'Invitation not found'}, status=404)

class GetMuteListView(View):
	def get(self, request, user_id):
		try:
			mute_list = MuteList.objects.get_mute_list(user_id=user_id)

			muted_users = mute_list.muted_users.values_list('user_id', flat=True)
			user_data = { 'muted_users': list(muted_users) }

			return JsonResponse(user_data)
		
		except MuteList.DoesNotExist:
			return JsonResponse({'error': 'Mute list not found'}, status=404)
		except ObjectDoesNotExist:
			return JsonResponse({'error': 'Target user not found'}, status=404)

class MuteToggleView(View):
	def post(self, request, user_id):
		try:
			mute_list = MuteList.objects.get_mute_list(user_id=user_id)
			data = json.loads(request.body)

			target = data.get('target')
			if not target:
				return JsonResponse({'error': 'Target user ID is required'}, status=400)

			if mute_list.muted_users.filter(user_id=target).exists():
				mute_list.umute_user(user_id)
				muted = False
			else:
				mute_list.mute_user(user_id)
				muted = True
			return JsonResponse({'success': True, 'muted': muted})
		
		except MuteList.DoesNotExist:
			return JsonResponse({'error': 'Mute list not found'}, status=404)
		except ObjectDoesNotExist:
			return JsonResponse({'error': 'Target user not found'}, status=404)