from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Message, PrivateMessage, InvitationToPlay

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

@csrf_exempt
def accept_invitation(request, invitationId):
	try:
		invitation = InvitationToPlay.objects.get(invitationId=invitationId)
		invitation.status = 'accepted'
		invitation.save() 
		return JsonResponse({'status': 'accepted'})
	except InvitationToPlay.DoesNotExist:
		return JsonResponse({'error': 'Invitation not found'}, status=404)

@csrf_exempt
def decline_invitation(request, invitationId):
	try:
		invitation = InvitationToPlay.objects.get(invitationId=invitationId)
		invitation.status = 'declined'
		invitation.save() 
		return JsonResponse({'status': 'declined'})
	except InvitationToPlay.DoesNotExist:
		return JsonResponse({'error': 'Invitation not found'}, status=404)