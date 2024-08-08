from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from .models import Message, PrivateMessage, MessageFromAuth
from .serializers import MessageSerializer, PrivateMessageSerializer, MessageFromAuthSerializer

class MessageListCreate(generics.ListCreateAPIView):
	queryset = Message.objects.all()
	serializer_class = MessageSerializer

class PrivateMessageListCreate(generics.ListCreateAPIView):
	queryset = PrivateMessage.objects.all()
	serializer_class = PrivateMessageSerializer

class MessageFromAuthListCreate(generics.ListCreateAPIView):
	queryset = MessageFromAuth.objects.all()
	serializer_class = MessageFromAuthSerializer

@api_view(['GET'])
def message_list(request):
	messages = Message.objects.all()
	private_messages = PrivateMessage.objects.all()
	messages_from_auth = MessageFromAuth.objects.all()

	message_serializer = MessageSerializer(messages, many=True)
	private_message_serializer = PrivateMessageSerializer(private_messages, many=True)
	message_from_auth_serializer = MessageFromAuthSerializer(messages_from_auth, many=True)

	combined_data = {
	'messages': message_serializer.data,
	'private_messages': private_message_serializer.data,
	'messages_from_auth': message_from_auth_serializer.data,
	}

	return Response(combined_data)