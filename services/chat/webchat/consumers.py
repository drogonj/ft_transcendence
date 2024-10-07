import json, requests, logging
from asgiref.sync import sync_to_async
from datetime import datetime
from .models import Message, PrivateMessage, InvitationToPlay, MuteList
from channels.generic.websocket import AsyncWebsocketConsumer
from chat_game import get_game_server

logger = logging.getLogger(__name__)
user_to_consumer = {}

class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		cookies = self.scope['cookies']
		if not cookies:
			logger.info('No cookies found')
			await self.close()
			return
		session_id = cookies.get('sessionid')
		if not session_id:
			logger.info('No session_id found in the cookie')
			await self.close()
			return

		session_response = requests.post('http://user-management:8000/api/user/get_session_user/', json={'sessionId': session_id})
		status = session_response.status_code

		if status != 200:
			await self.close()
			return
		else:
			response_data = session_response.json()
			if response_data.get('success'):
				self.user_id = int(response_data.get('id'))
			else:
				await self.close()
				return

		self.rooms = set()
		self.room_name = self.scope['url_route']['kwargs']['room_name']
		self.rooms.add(self.room_name)
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
		room_name = f'ID_{self.user_id}'
		self.rooms.add(room_name)
		await self.channel_layer.group_add(room_name, self.channel_name)

		await sync_to_async(MuteList.objects.get_or_create_mute_list)(self.user_id)
		await self.accept()

	async def disconnect(self, close_code):
		if self.user_id in user_to_consumer:
			del user_to_consumer[self.user_id]
		
		for room_name in self.rooms:
			await self.channel_layer.group_discard(
				room_name,
				self.channel_name
			)

		self.rooms.clear()

	async def logout(self):
		await self.close()

	async def receive(self, text_data):
		data = json.loads(text_data)
		logging.info(f'received data: {data}')

		message_content = data.get('content')
		if message_content:
			if len(message_content) > 200:
				id = data.get('user_id')
				room_name = f'ID_{user_id}'
				await self.channel_layer.group_send(
					room_name, {
					'type': 'error',
					'content': f'Nice try buddy! (Reason: Reached max length)'
				})

		if data['type'] == 'system':
			content = data.get('content')
			await self.send(text_data=json.dumps({
				'type': 'system',
				'content': f'{content}.',
			}))

		if data['type'] == 'game_message':
			content = data.get('content')
			await self.send(text_data=json.dumps({
				'type': 'game_message',
				'content': f'{content}',
			}))

		if data['type'] == 'user_status_update':
			await self.channel_layer.group_send(
				self.room_name,
				{
					'type': data['type'],
					'user_id': data['user_id'],
					'username': data['username'],
					'status': data['status'],
					'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
				}
			)

		elif data['type'] == 'chat_message':
			connected_users = user_to_consumer.keys()
			id = data.get('user_id')

			new_message = await sync_to_async(Message.objects.create)(
				type = data['type'],
				content = data['content'],
				user_id = data['user_id'],
				username = data['username'],
				timestamp = datetime.now(),
			)

			message_count = await sync_to_async(Message.objects.count)()
			if message_count > 50:
				oldest_messages = await sync_to_async(lambda: list(Message.objects.order_by('timestamp')[:message_count - 50]))()
				for message in oldest_messages:
					await sync_to_async(message.delete)()

			for user_id in connected_users:
				if user_id != id:
					mute_list = await sync_to_async(MuteList.objects.get_or_create_mute_list)(user_id)
					muted_users = await sync_to_async(list)(mute_list.muted_users.values_list('user_id', flat=True))
					
					if not id in muted_users:
						room_name = f'ID_{user_id}'
						await self.channel_layer.group_send(
							room_name,
							{
								'messageId': new_message.messageId,
								'type': new_message.type,
								'content': new_message.content,
								'user_id': new_message.user_id,
								'username': new_message.username,
								'timestamp': new_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
							}
						)

			await self.send(text_data=json.dumps({
				'messageId': new_message.messageId,
				'type': new_message.type,
				'content': new_message.content,
				'user_id': new_message.user_id,
				'username': new_message.username,
				'timestamp': new_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
			}))


		elif data['type'] == 'private_message':
			id = data.get('user_id')
			receiver = data.get('receiver_id')
			room_name = f'ID_{receiver}'
			uri = f'http://user-management:8000/api/user/get_user/{receiver}/'
			
			try:
				response = requests.get(uri)
				response.raise_for_status()
				user = response.json()
			except requests.exceptions.RequestException as e:
				logger.error(f"Error fetching user data: {e}")
				user = []

			mute_list = await sync_to_async(MuteList.objects.get_or_create_mute_list)(receiver)
			muted_users = await sync_to_async(list)(mute_list.muted_users.values_list('user_id', flat=True))
						


			if not id in muted_users:
				new_message = await sync_to_async(PrivateMessage.objects.create)(
					type = data['type'],
					content = data['content'],
					user_id = data['user_id'],
					username = data['username'],
					timestamp = datetime.now(),
					receiver_id = data['receiver_id'],
					receiver_username = data['receiver_username']
				)

				private_message_count = await sync_to_async(PrivateMessage.objects.filter(user_id=data['user_id'], receiver_id=data['receiver_id']).count)()
				if private_message_count > 20:
					oldest_private_messages = await sync_to_async(lambda: list(PrivateMessage.objects.filter(user_id=data['user_id'], receiver_id=data['receiver_id']).order_by('timestamp')[:private_message_count - 20]))()
					for message in oldest_private_messages:
						await sync_to_async(message.delete)()

				await self.channel_layer.group_send(
					room_name,
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

				await self.send(text_data=json.dumps({
						'messageId': new_message.messageId,
						'type': new_message.type,
						'content': new_message.content,
						'user_id': new_message.user_id,
						'username': new_message.username,
						'timestamp': new_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
						'receiver_id': new_message.receiver_id,
						'receiver_username': new_message.receiver_username
				}))

			else:
				await self.send(text_data=json.dumps({
					'type': 'system',
					'content': f'DM not delivered (Reason: Muted).',
				}))


		elif data['type'] == 'invitation_to_play':
			id = data.get('user_id')
			receiver = data.get('receiver_id')
			room_name = f'ID_{receiver}'
			connected_users = user_to_consumer.keys()
			uri = f'http://user-management:8000/api/user/get_user/{receiver}/'
			uri2 = f'http://user-management:8000/api/user/get_user/{id}/'

			try:
				response = requests.get(uri)
				response.raise_for_status()
				user = response.json()
			except requests.exceptions.RequestException as e:
				logger.error(f"Error fetching user data: {e}")
				user = []

			try:
				response2 = requests.get(uri2)
				response2.raise_for_status()
				user2 = response2.json()
			except requests.exceptions.RequestException as e:
				logger.error(f"Error fetching user data: {e}")
				user2 = []

			if user2['status'] != 'online':
				status2 = user2['status']
				await self.send(text_data=json.dumps({
					'type': 'system',
					'content': f'Invitation not delivered (Reason: You are {status2}).',
				}))

			elif user['status'] != 'online':
				status = user['status']
				await self.send(text_data=json.dumps({
					'type': 'system',
					'content': f'Invitation not delivered (Reason: {status}).',
				}))

			else:
				for user_id in connected_users:
					if user_id == receiver:
						mute_list = await sync_to_async(MuteList.objects.get_or_create_mute_list)(receiver)
						muted_users = await sync_to_async(list)(mute_list.muted_users.values_list('user_id', flat=True))

						if not id in muted_users:
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
							await self.send(text_data=json.dumps(message_data))
						
						else:
							await self.send(text_data=json.dumps({
								'type': 'system',
								'content': f'Invitation not delivered (Reason: Muted).',
						}))
		
		elif data['type'] == 'invitation_response':
			id = data.get('user_id')
			receiver = data.get('receiver_id')
			room_name = f'ID_{receiver}'
			uri = f'http://user-management:8000/api/user/get_user/{receiver}/'
			
			try:
				response = requests.get(uri)
				response.raise_for_status()
				user = response.json()
			except requests.exceptions.RequestException as e:
				logger.error(f"Error fetching user data: {e}")
				user = []

			logging.info(user)

			if user['status'] == 'offline':
				try:
					invitation = await sync_to_async(InvitationToPlay.objects.get)(invitationId=data['invitationId'])
					invitation.status = 'cancelled'
					await sync_to_async(invitation.save)()

					message_data = {
						'type': 'cancelled_invitation',
						'invitationId': data['invitationId'],
						'status': 'offline',
						'user_id': data['user_id'],
						'username': data['username'],
						'receiver_id': data['receiver_id'],
						'receiver_username': data['receiver_username']

					}

					await self.send(text_data=json.dumps(message_data))

				except InvitationToPlay.DoesNotExist:
					await self.send(text_data=json.dumps({
						'type': 'system',
						'content': 'Invitation not found.',
					}))

			elif user['status'] == 'in-game':
				try:
					invitation = await sync_to_async(InvitationToPlay.objects.get)(invitationId=data['invitationId'])
					invitation.status = 'cancelled'
					await sync_to_async(invitation.save)()

					message_data = {
						'type': 'cancelled_invitation',
						'invitationId': data['invitationId'],
						'status': 'in-game',
						'user_id': data['user_id'],
						'username': data['username'],
						'receiver_id': data['receiver_id'],
						'receiver_username': data['receiver_username']

					}
					
					await self.send(text_data=json.dumps(message_data))

				except InvitationToPlay.DoesNotExist:
					await self.send(text_data=json.dumps({
						'type': 'system',
						'content': 'Invitation not found.',
					}))

			else:
				message_data = {
					'invitationId': data['invitationId'],
					'status': data['status'],
					'type': data['type'],
					'user_id': data['user_id'],
					'username': data['username'],
					'receiver_id': data['receiver_id'],
					'receiver_username': data['receiver_username']
				}

				game_ws_client = get_game_server()

				if not game_ws_client and not game_ws_client.is_connected():
					print("The connection with game server is not established..")
					return
				
				await game_ws_client.send("createGame", {"userId1": int(id), "userId2": int(receiver)})
				await self.channel_layer.group_send(room_name, message_data)
				await self.send(text_data=json.dumps(message_data))

		elif data['type'] == 'cancelled_invitation':
			receiver = data.get('receiver_id')
			room_name = f'ID_{receiver}'

			message_data = {
				'invitationId': data['invitationId'],
				'status': data['status'],
				'type': data['type'],
				'user_id': data['user_id'],
				'username': data['username'],
				'receiver_id': data['receiver_id'],
				'receiver_username': data['receiver_username']
			}
			
			await self.channel_layer.group_send(room_name, message_data)

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
			'user_id': event['user_id'],
			'username': event['username'],
			'status': event['status'],
			'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
		}))

		logger.info(f'{event["username"]} is {event["status"]}')

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

	async def cancelled_invitation(self, event):
		await self.send(text_data=json.dumps({
			'invitationId': event['invitationId'],
			'status': event['status'],
			'type': event['type'],
			'user_id': event['user_id'],
			'username': event['username'],
			'receiver_id': event['receiver_id'],
			'receiver_username': event['receiver_username']
		}))
		#log-cancel
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

	async def error(self, event):
		await self.send(text_data=json.dumps({
			'type': event['type'],
			'content': event['content'],
		}))
		#log-error
		logger.info(f'Trying to hack or being hacked')