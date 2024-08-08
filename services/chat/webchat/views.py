from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from .models import Message, PrivateMessage, MessageFromAuth, MessageFromChat
from .serializers import MessageSerializer, PrivateMessageSerializer, MessageFromAuthSerializer, MessageFromChatSerializer

class MessageListCreate(generics.ListCreateAPIView):
	queryset = Message.objects.all()
	serializer_class = MessageSerializer

class PrivateMessageListCreate(generics.ListCreateAPIView):
	queryset = PrivateMessage.objects.all()
	serializer_class = PrivateMessageSerializer

class MessageFromAuthListCreate(generics.ListCreateAPIView):
	queryset = MessageFromAuth.objects.all()
	serializer_class = MessageFromAuthSerializer

# class MessageFromChatListCreate(generics.ListCreateAPIView):
# 	queryset = MessageFromChat.objects.all()
# 	serializer_class = MessageFromChatSerializer

@api_view(['GET'])
def message_list(request):
	messages = Message.objects.all()
	private_messages = PrivateMessage.objects.all()
	messages_from_auth = MessageFromAuth.objects.all()
	# messages_from_chat = MessageFromChat.objects.all()

	message_serializer = MessageSerializer(messages, many=True)
	private_message_serializer = PrivateMessageSerializer(private_messages, many=True)
	message_from_auth_serializer = MessageFromAuthSerializer(messages_from_auth, many=True)
	# message_from_chat_serializer = MessageFromChatSerializer(messages_from_chat, many=True)

	# combined_data = {
	# 	'messages': message_serializer.data,
	# 	'private_messages': private_message_serializer.data,
	# 	'messages_from_auth': message_from_auth_serializer.data,
	# 	'messages_from_chat': message_from_chat_serializer.data
	# }

	combined_data = {
	'messages': message_serializer.data,
	'private_messages': private_message_serializer.data,
	'messages_from_auth': message_from_auth_serializer.data,
	}

	return Response(combined_data)