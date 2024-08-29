# friends/consumers.py
import os, django, json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async, async_to_sync

from .models import Friendship

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

async def notify_user_status(channel_layer, user, status):
	connected_friends = await sync_to_async(Friendship.objects.get_connected_friends)(user)

	if status == 'online':
		event_type = 'friend_connected_notification'
	elif status == 'offline':
		event_type = 'friend_disconnected_notification'
	elif status == 'ingame':
		await user.set_status('ingame')
		event_type = 'friend_ingame_notification'
	else:
		logger.error(f'Friends Notification Bad Type: {status}')
		return
	for friend in connected_friends:
		group_name = f'user_{friend.id}'
		await channel_layer.group_send(
			group_name,
			{
				'type': event_type,
				'id': user.id,
				'username': user.username
			}
		)

class FriendRequestConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.user = self.scope['user']

		if self.user.is_authenticated:
			await self.channel_layer.group_add(
				f'user_{self.user.id}',
				self.channel_name
			)
			await self.accept()
			await self.set_active_connection(1)
			await self.send(text_data=json.dumps({
				'message': f'Websocket connected as {self.user.username}, your id is {self.user.id}'
			}))
		else:
			await self.close()

	async def disconnect(self, close_code):
		if hasattr(self, 'user'):
			await self.channel_layer.group_discard(
				f'user_{self.user.id}',
				self.channel_name
			)
			await self.set_active_connection(-1)

	async def set_active_connection(self, value):
		self.user.active_connections += value
		if self.user.active_connections > 0 and not self.user.is_connected:
			await self.user.set_status('online')
			await self.notify_chat_user_connected(self.user)
			await notify_user_status(self.channel_layer, self.user, 'online')
		elif self.user.active_connections <= 0:
			await self.user.set_status('offline')
			await self.notify_chat_user_disconnected(self.user)
			await notify_user_status(self.channel_layer, self.user, 'offline')

	async def close_websocket(self, event):
		await self.close()

	async def receive(self, text_data):
		# Logique pour traiter les messages reçus si nécessaire
		pass

	async def notify_chat_user_connected(self, user):
		await self.channel_layer.group_send(
			'general',
			{
				'type': 'user_status_update',
				'content': f'{user.username} has joined the chat',
				'user_id': user.id,
				'username': user.username,
				'is_connected': True
			}
		)

	async def notify_chat_user_disconnected(self, user):
		await self.channel_layer.group_send(
			'general',
			{
				'type': 'user_status_update',
				'content': f'{user.username} has left the chat',
				'user_id': user.id,
				'username': user.username,
				'is_connected': False
			}
		)

	async def friend_request_notification(self, event):
		from_user = event['from_user']
		avatar = event['avatar']
		id = event['id']

		await self.send(text_data=json.dumps({
			'type': 'friend_request_notification',
			'id': id,
			'username': from_user,
			'avatar': avatar,
		}))

	async def accepted_friendship_request_notification(self, event):
		from_user = event['from_user']
		avatar = event['avatar']
		is_connected = event['is_connected']
		id = event['id']

		await self.send(text_data=json.dumps({
			'type': 'accepted_friendship_request_notification',
			'id': id,
			'username': from_user,
			'avatar': avatar,
			'is_connected': is_connected,
		}))

	async def canceled_friendship_notification(self, event):
		from_user = event['from_user']
		avatar = event['avatar']
		id = event['id']

		await self.send(text_data=json.dumps({
			'type': 'canceled_friendship_notification',
			'id': id,
			'username': from_user,
			'avatar': avatar,
		}))

	async def friend_connected_notification(self, event):
		user_id = event['id']
		username = event['username']

		await self.send(text_data=json.dumps({
			'type': 'friend_connected_notification',
			'id': user_id,
			'username': username,
		}))

	async def friend_disconnected_notification(self, event):
		user_id = event['id']
		username = event['username']

		await self.send(text_data=json.dumps({
			'type': 'friend_disconnected_notification',
			'id': user_id,
			'username': username,
		}))

	async def friend_ingame_notification(self, event):
		user_id = event['id']
		username = event['username']

		await self.send(text_data=json.dumps({
			'type': 'friend_ingame_notification',
			'id': user_id,
			'username': username,
		}))