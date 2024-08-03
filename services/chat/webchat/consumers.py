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
	format='%(asctime)s - %(name)s - %(levelname)s - %(content)s',
	handlers=[
		logging.StreamHandler(sys.stdout)
	]
)

user_to_consumer = {}

class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_name = self.scope['url_route']['kwargs']['room_name']
		self.user_id = self.scope['url_route']['kwargs']['user_id']
		user_to_consumer[self.user_id] = self
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
			self.room_name,
			self.channel_name
		)

		await self.accept()

		logger.info(f'User id: {self.user_id}')
		logger.info(f'User connected: {self.username}')
		await self.channel_layer.group_send(
			self.room_name,
			{
				'type': 'connection',
				'content': f'{self.username} has joined the chat',
				'user_id': self.user_id,
				'username': '',
				'timestamp': now().strftime('%H:%M:%S')
			})

	async def disconnect(self, close_code):
		if self.user_id in user_to_consumer:
			del user_to_consumer[self.user_id]

		await self.channel_layer.group_send(
			self.room_name,
			{
				'type': 'connection',
				'content': f'{self.username} has left the chat',
				'user_id': self.user_id,
				'username': '',
				'timestamp': now().strftime('%H:%M:%S')
			})
		
		await self.channel_layer.group_discard(
			self.room_name,
			self.channel_name
		)

	async def logout(self):
		await self.close()

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		new_message = await sync_to_async(Message.objects.create)(
			type = text_data_json['type'],
			content = text_data_json['content'],
			user_id = text_data_json['user_id'],
			username = text_data_json['username'],
			timestamp = now(),
			room_name = self.room_name
		)

		await self.channel_layer.group_send(
			self.room_name,
			{
				'type': 'chat_message',
				'content': new_message.content,
				'user_id': new_message.user_id,
				'username': new_message.username,
				'timestamp': new_message.timestamp.strftime('%H:%M:%S')
			}
		)	

	async def chat_message(self, event):
		await self.send(text_data=json.dumps({
			'type': event['type'],
			'content': event['content'],
			'user_id': event['user_id'],
			'username': event['username'],
			'timestamp': event['timestamp']
		}))

	async def connection(self, event):
		await self.send(text_data=json.dumps({
			'type': event['type'],
			'content': event['content'],
			'user_id': event['user_id'],
			'username': event['username'],
			'timestamp': event['timestamp']
		}))