from rest_framework import serializers
from .models import Message, PrivateMessage, MessageFromAuth, MessageFromChat

class MessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = Message
		fields = ['id', 'type', 'content', 'user_id', 'username', 'timestamp']

class PrivateMessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = PrivateMessage
		fields = ['id', 'type', 'content', 'user_id', 'username', 'timestamp', 'receiver_id', 'receiver_username']

class MessageFromAuthSerializer(serializers.ModelSerializer):
	class Meta:
		model = MessageFromAuth
		fields = ['id', 'type', 'content', 'user_id', 'username', 'is_connected']

class MessageFromChatSerializer(serializers.ModelSerializer):
	class Meta:
		model = MessageFromChat
		fields = ['id', 'type', 'content', 'user_id', 'username', 'timestamp']