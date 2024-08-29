import json, requests, logging
from asgiref.sync import sync_to_async
from datetime import datetime
from .models import Message, PrivateMessage, InvitationToPlay
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)
user_to_consumer = {}

class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_name = self.scope['url_route']['kwargs']['room_name']
		self.rooms = set()
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

		await self.channel_layer.group_add(self.room_name, self.channel_name)

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

		if data['type'] == 'join_room':
			room_name = data.get('room')
			self.rooms.add(room_name)
			await self.channel_layer.group_add(room_name, self.channel_name)

		elif data['type'] == 'leave_room':
			room_name = data.get('room')
			await self.channel_layer.group_discard(room_name,self.channel_name)

		elif data['type'] == 'user_status_update':
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
					'messageId': new_message.messageId,
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
					'messageId': new_message.messageId,
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
			receiver = data['receiver_id']
			room_name = data.get('room')
			room_name2 = f'ID_{receiver}'
			uri = f'http://user-management:8000/api/user/get_user/{receiver}/'
			
			try:
				response = requests.get(uri)
				response.raise_for_status()
				user = response.json()
			except requests.exceptions.RequestException as e:
				logger.error(f"Error fetching user data: {e}")
				user = []

			if user['is_connected'] is False:
				await self.channel_layer.group_send(
					room_name,
					{
						'invitationId': None,
						'type': 'system',
						'content': f'{data["receiver_username"]} is not connected',
						'user_id': data['user_id'],
						'username': data['username'],
						'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
						'receiver_id': data['receiver_id'],
						'receiver_username': data['receiver_username']
					}
				)
			else:
				new_message = await sync_to_async(InvitationToPlay.objects.create)(
					type = data['type'],
					user_id = data['user_id'],
					username = data['username'],
					timestamp = datetime.now(),
					receiver_id = data['receiver_id'],
					receiver_username = data['receiver_username']
				)
				message_data = {
					'invitationId': new_message.invitationId,
					'status': new_message.status,
					'type': new_message.type,
					'user_id': new_message.user_id,
					'username': new_message.username,
					'timestamp': new_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
					'receiver_id': new_message.receiver_id,
					'receiver_username': new_message.receiver_username
				}
				await self.channel_layer.group_send(room_name, message_data)
				await self.channel_layer.group_send(room_name2, message_data)
		
		elif data['type'] == 'invitation_response':
			room_name = data.get('room')
			await self.channel_layer.group_send(
				room_name,
				{
					'invitationId': data['invitationId'],
					'status': data['status'],
					'type': data['type'],
					'user_id': data['user_id'],
					'username': data['username'],
					'receiver_id': data['receiver_id'],
					'receiver_username': data['receiver_username']
				}
			)

		elif data['type'] == 'cancel_invitation':
			room_name = data.get('room')
			await self.channel_layer.group_send(
				room_name,
				{
					'invitationId': data['invitationId'],
					'status': data['status'],
					'type': data['type'],
					'user_id': data['user_id'],
					'username': data['username'],
					'receiver_id': data['receiver_id'],
					'receiver_username': data['receiver_username']
				}
			)

		elif data['type'] == 'troll_message':
			await self.channel_layer.group_send(
				self.room_name,
				{
					'type': data['type'],
					'content': data['content'],
					'user_id': data['user_id'],
					'username': data['username'],
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
		user_id = event['user_id']
		username = event['username']
		is_connected = event['is_connected']
		if is_connected:
			logger.info(f'Received user status update from {user_id}-{username} : connected')
		else:
			logger.info(f'Received user status update from {user_id}-{username} : disconnected')

	async def chat_message(self, event):
		await self.send(text_data=json.dumps({
			'messageId': event['messageId'],
			'type': event['type'],
			'content': event['content'],
			'user_id': event['user_id'],
			'username': event['username'],
			'timestamp': event['timestamp']
		}))
		#log-chat_message
		username = event['username']
		content = event['content']
		logger.info(f'{username} sent: {content}')

	async def private_message(self, event):
		await self.send(text_data=json.dumps({
			'messageId': event['messageId'],
			'type': event['type'],
			'content': event['content'],
			'user_id': event['user_id'],
			'username': event['username'],
			'timestamp': event['timestamp'],
			'receiver_id': event['receiver_id'],
			'receiver_username': event['receiver_username']
		}))
		#log-private_message
		username = event['username']
		content = event['content']
		receiver_username = event['receiver_username']
		logger.info(f'{username} sent: {content} to {receiver_username}')

	async def invitation_to_play(self, event):
		await self.send(text_data=json.dumps({
			'invitationId': event['invitationId'],
			'status': event['status'],
			'type': event['type'],
			'user_id': event['user_id'],
			'username': event['username'],
			'timestamp': event['timestamp'],
			'receiver_id': event['receiver_id'],
			'receiver_username': event['receiver_username']
		}))
		#log-invitation_to_play
		username = event['username']
		receiver_username = event['receiver_username']
		logger.info(f'{username} invited to play {receiver_username}')

	async def invitation_response(self, event):
		await self.send(text_data=json.dumps({
			'invitationId': event['invitationId'],
			'status': event['status'],
			'type': event['type'],
			'user_id': event['user_id'],
			'username': event['username'],
			'receiver_id': event['receiver_id'],
			'receiver_username': event['receiver_username']
		}))
		#log-response
		username = event['username']
		status = event['status']
		receiver_username = event['receiver_username']
		logger.info(f'{receiver_username} {status} {username}\'s invitation')

	async def cancel_invitation(self, event):
		await self.send(text_data=json.dumps({
			'invitationId': event['invitationId'],
			'status': event['status'],
			'type': event['type'],
			'user_id': event['user_id'],
			'username': event['username'],
			'receiver_id': event['receiver_id'],
			'receiver_username': event['receiver_username']
		}))
		#log-response
		username = event['username']
		status = event['status']
		receiver_username = event['receiver_username']
		logger.info(f'{username} {status} invitation to {receiver_username}')

	async def system(self, event):
		await self.send(text_data=json.dumps({
			'status': event.get('status'),
			'invitationId': event.get('invitationId'),
			'content': event.get('content'),
			'type': event.get('type'),
			'timestamp': event.get('timestamp'),
			'user_id': event.get('user_id'),
			'username': event.get('username'),
			'receiver_id': event.get('receiver_id'),
			'receiver_username': event.get('receiver_username')
		}))
		#log-response
		logger.info(f'data from system : {event}')

	async def troll_message(self, event):
		await self.send(text_data=json.dumps({
			'type': event['type'],
			'content': event['content'],
			'user_id': event['user_id'],
			'username': event['username'],
		}))
		#log-troll
		username = event['username']
		logger.info(f'{username} speaks to self')