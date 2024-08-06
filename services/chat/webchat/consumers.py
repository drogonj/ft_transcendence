import json, requests
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message, MessageFromAuth, PrivateMessage, MessageFromChat
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

	async def disconnect(self, close_code):
		if self.user_id in user_to_consumer:
			del user_to_consumer[self.user_id]
		
		await self.channel_layer.group_discard(
			self.room_name,
			self.channel_name
		)

	async def logout(self):
		await self.close()

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)

		if text_data_json['type'] == 'user_status_update':
			new_message = await sync_to_async(MessageFromAuth.objects.create)(
				type = text_data_json['type'],
				content = text_data_json['content'],
				user_id = text_data_json['user_id'],
				username = text_data_json['username'],
				is_connected = text_data_json['is_connected']
			)
			await self.channel_layer.group_send(
				self.room_name,
				{
					'type': new_message.type,
					'content': new_message.content,
					'user_id': new_message.user_id,
					'username': new_message.username,
					'is_connected': new_message.is_connected
				}
			)		

		elif text_data_json['type'] == 'chat_message':
			new_message = await sync_to_async(Message.objects.create)(
				type = text_data_json['type'],
				content = text_data_json['content'],
				user_id = text_data_json['user_id'],
				username = text_data_json['username'],
				timestamp = now(),
			)
			await self.channel_layer.group_send(
				self.room_name,
				{
					'type': new_message.type,
					'content': new_message.content,
					'user_id': new_message.user_id,
					'username': new_message.username,
					'timestamp': new_message.timestamp.strftime('%H:%M:%S'),
				}
			)

		elif text_data_json['type'] == 'private_message':
			new_message = await sync_to_async(PrivateMessage.objects.create)(
				type = text_data_json['type'],
				content = text_data_json['content'],
				user_id = text_data_json['user_id'],
				username = text_data_json['username'],
				timestamp = now(),
				receiver_id = text_data_json['receiver_id'],
				receiver_username = text_data_json['receiver_username']
			)
			await self.channel_layer.group_send(
				self.room_name,
				{
					'type': new_message.type,
					'content': new_message.content,
					'user_id': new_message.user_id,
					'username': new_message.username,
					'timestamp': new_message.timestamp.strftime('%H:%M:%S'),
					'receiver_id': new_message.receiver_id,
					'receiver_username': new_message.receiver_username
				}
			)

	async def user_status_update(self, event):
		await self.send(text_data=json.dumps({
			'type': event['type'],
			'content': event['content'],
			'user_id': event['user_id'],
			'username': event['username'],
			'is_connected': event['is_connected'],
			'timestamp': now().strftime('%H:%M:%S')
		}))
		#log
		id = event['user_id']
		is_connected = event['is_connected']
		logger.info(f'Received user status update from {id} : {is_connected}')

	async def chat_message(self, event):
		await self.send(text_data=json.dumps({
			'type': event['type'],
			'content': event['content'],
			'user_id': event['user_id'],
			'username': event['username'],
			'timestamp': event['timestamp']
		}))
		#log
		username = event['username']
		content = event['content']
		logger.info(f'{username} sent: {content}')


	async def private_message(self, event):
		await self.send(text_data=json.dumps({
			'type': event['type'],
			'content': event['content'],
			'user_id': event['user_id'],
			'username': event['username'],
			'timestamp': event['timestamp'],
			'receiver_id': event['receiver_id'],
			'receiver_username': event['receiver_username']
		}))
		#log
		username = event['username']
		content = event['content']
		receiver_username = event['receiver_username']
		logger.info(f'{username} sent: {content} to {receiver_username}')