from django.http import JsonResponse
from .models import Message, PrivateMessage

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
