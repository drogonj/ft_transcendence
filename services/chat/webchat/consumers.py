import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message
from asgiref.sync import sync_to_async
from django.utils.timezone import now

class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_name = self.scope['url_route']['kwargs']['room_name']
		self.room_group_name = f'chat_{self.room_name}'

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		await self.accept()

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['message']
		user_id = text_data_json['user_id']
		username = text_data_json['username']

		new_message = await sync_to_async(Message.objects.create)(
			user_id=user_id,
			username=username,
			content=message,
			timestamp=now(),
			room_name=self.room_name
		)

		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'chat_message',
				'message': message,
				'user_id': user_id,
				'username': username,
				'timestamp': new_message.timestamp.strftime('%Y-%m-%d %H:%M:%S')
			}
		)

	async def chat_message(self, event):
		message = event['message']
		user_id = event['user_id']
		username = event['username']
		timestamp = event['timestamp']

		await self.send(text_data=json.dumps({
			'message': message,
			'user_id': user_id,
			'username': username,
			'timestamp': timestamp
		}))
