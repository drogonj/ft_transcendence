import json, requests
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message
from asgiref.sync import sync_to_async
from django.utils.timezone import now

# logging setup for info logs
import logging
import sys
logger = logging.getLogger(__name__)
logging.basicConfig(
	level=logging.INFO,
	format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
	handlers=[
		logging.StreamHandler(sys.stdout)
	]
)

class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_name = self.scope['url_route']['kwargs']['room_name']
		self.room_group_name = f'chat_{self.room_name}'
		self.user_id = self.scope['url_route']['kwargs']['user_id']
		uri = f'http://user-management:8000/api/user/get_user/{self.user_id}/'

		try:
			response = requests.get(uri)
			response.raise_for_status()
			user_data = response.json()
			self.username = user_data.get('username', {})
		except requests.exceptions.RequestException as e:
			logger.error(f"Error fetching user data: {e}")
			user_data = []

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		await self.accept()

		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'connection',
				'message': f'{self.username} has joined the chat',
				'user_id': self.user_id,
				'username': '',
				'timestamp': now().strftime('%H:%M:%S')
			})

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'connection',
				'message': f'{self.username} has left the chat',
				'user_id': self.user_id,
				'username': '',
				'timestamp': ''
			})

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
				'username': username if username else '',
				'timestamp': new_message.timestamp.strftime('%H:%M:%S')
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

	async def connection(self, event):
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