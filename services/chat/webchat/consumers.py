import json, requests
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message, PrivateMessage, InvitationToPlay
from asgiref.sync import sync_to_async
from datetime import datetime

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
		data = json.loads(text_data)

		if data['type'] == 'user_status_update':
			await self.channel_layer.group_send(
				self.room_name,
				{
					'type': data['type'],
					'content': data['content'],
					'user_id': data['user_id'],
					'username': data['username'],
					'is_connected': data['is_connected'],
					'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
				}
			)		

		elif data['type'] == 'chat_message':
			new_message = await sync_to_async(Message.objects.create)(
				type = data['type'],
				content = data['content'],
				user_id = data['user_id'],
				username = data['username'],
				timestamp = datetime.now(),
			)	
			await self.channel_layer.group_send(
				self.room_name,
				{
					'type': new_message.type,
					'content': new_message.content,
					'user_id': new_message.user_id,
					'username': new_message.username,
					'timestamp': new_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
				}
			)

		elif data['type'] == 'private_message':
			new_message = await sync_to_async(PrivateMessage.objects.create)(
				type = data['type'],
				content = data['content'],
				user_id = data['user_id'],
				username = data['username'],
				timestamp = datetime.now(),
				receiver_id = data['receiver_id'],
				receiver_username = data['receiver_username']
			)
			await self.channel_layer.group_send(
				self.room_name,
				{
					'type': new_message.type,
					'content': new_message.content,
					'user_id': new_message.user_id,
					'username': new_message.username,
					'timestamp': new_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
					'receiver_id': new_message.receiver_id,
					'receiver_username': new_message.receiver_username
				}
			)

		elif data['type'] == 'invitation_to_play':
			new_message = await sync_to_async(InvitationToPlay.objects.create)(
				type = data['type'],
				content = data['content'],
				user_id = data['user_id'],
				username = data['username'],
				timestamp = datetime.now(),
				receiver_id = data['receiver_id'],
				receiver_username = data['receiver_username']
			)
			await self.channel_layer.group_send(
				self.room_name,
				{
					'type': new_message.type,
					'content': new_message.content,
					'user_id': new_message.user_id,
					'username': new_message.username,
					'timestamp': new_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
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
			'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
		}))
		#log-status_update
		id = event['user_id']
		username = event['username']
		is_connected = event['is_connected']
		if is_connected:
			logger.info(f'Received user status update from {id}-{username} : connected')
		else:
			logger.info(f'Received user status update from {id}-{username} : disconnected')

	async def chat_message(self, event):
		await self.send(text_data=json.dumps({
			'type': event['type'],
			'content': event['content'],
			'user_id': event['user_id'],
			'username': event['username'],
			'timestamp': event['timestamp']
		}))
		#log-chat_message
		id = event['user_id']
		username = event['username']
		content = event['content']
		logger.info(f'{id}-{username} sent: {content}')


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
		#log-private_message
		id = event['user_id']
		receiver_id = event['receiver_id']
		username = event['username']
		content = event['content']
		receiver_username = event['receiver_username']
		logger.info(f'{id}-{username} sent: {content} to {receiver_id}-{receiver_username}')