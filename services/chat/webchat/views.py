from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from .models import Message, PrivateMessage
from .serializers import MessageSerializer, PrivateMessageSerializer

class MessageListCreate(generics.ListCreateAPIView):
	queryset = Message.objects.all()
	serializer_class = MessageSerializer

class PrivateMessageListCreate(generics.ListCreateAPIView):
	queryset = PrivateMessage.objects.all()
	serializer_class = PrivateMessageSerializer

@api_view(['GET'])
def message_list(request):
	messages = Message.objects.all()
	private_messages = PrivateMessage.objects.all()

	message_serializer = MessageSerializer(messages, many=True)
	private_message_serializer = PrivateMessageSerializer(private_messages, many=True)

	combined_data = {
	'messages': message_serializer.data,
	'private_messages': private_message_serializer.data,
	}

	return Response(combined_data)