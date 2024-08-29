from django.http import JsonResponse
from .models import Message, PrivateMessage, InvitationToPlay
from django.views.decorators.csrf import ensure_csrf_cookie

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