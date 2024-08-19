from rest_framework import serializers
from .models import Message, PrivateMessage

class MessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = Message
		fields = ['id', 'type', 'content', 'user_id', 'username', 'timestamp']

class PrivateMessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = PrivateMessage
		fields = ['id', 'type', 'content', 'user_id', 'username', 'timestamp', 'receiver_id', 'receiver_username']