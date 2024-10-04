# friends/consumers.py
import os, django, json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async, async_to_sync
from django.db import transaction
from channels.layers import get_channel_layer
from .models import Friendship
import asyncio

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

connected_users = set()

user_lock = asyncio.Lock()

async def change_and_notify_user_status(channel_layer, user, status):
	if user.status == status:
		return

	if status == 'online':
		user.status = 'online'
		user.is_connected = True
		event_type = 'friend_connected_notification'
	elif status == 'offline':
		user.status = 'offline'
		user.is_connected = False
		event_type = 'friend_disconnected_notification'
	elif status == 'in-game':
		user.status = 'in-game'
		user.is_connected = True
		event_type = 'friend_ingame_notification'
	elif status == 'matchmaking':
		user.status = 'matchmaking'
		user.is_connected = True
		event_type = 'friend_matchmaking_notification'
	elif status == 'tournament':
		user.status = 'tournament'
		user.is_connected = True
		event_type = 'friend_tournament_notification'
	else:
		logger.error(f'Friends Notification Bad Type: {status}')
		return

	await sync_to_async(user.save)(update_fields=['status', 'is_connected'])
	await notify_chat_user_new_status(channel_layer, user)

	connected_friends = await sync_to_async(Friendship.objects.get_connected_friends)(user)

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

async def notify_chat_user_new_status(channel_layer, user):
	await channel_layer.group_send(
		'general',
		{
			'type': 'user_status_update',
			'user_id': user.id,
			'username': user.username,
			'status': user.status
		}
	)

#Try to implement super() in the future

class FriendRequestConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.user = self.scope['user']
		self.local_game = False

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
		async with user_lock:
			await sync_to_async(self.user.refresh_from_db)()
			self.user.active_connections += value
			await sync_to_async(self.user.save)(update_fields=['active_connections'])
			if self.user.active_connections > 0 and not self.user.is_connected:
				connected_users.add(self.user.id)
				await change_and_notify_user_status(self.channel_layer, self.user, 'online')
			elif self.user.active_connections <= 0:
				connected_users.discard(self.user.id)
				await change_and_notify_user_status(self.channel_layer, self.user, 'offline')
			# await sync_to_async(self.user.save)(update_fields=['active_connections'])
			await sync_to_async(self.user.refresh_from_db)()

	async def close_websocket(self, event):
		await self.close()

	async def receive(self, text_data):
		logger.info(f'Websocket received: {text_data}')

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
		status = event['status']
		id = event['id']

		await self.send(text_data=json.dumps({
			'type': 'accepted_friendship_request_notification',
			'id': id,
			'username': from_user,
			'avatar': avatar,
			'status': status,
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

	async def friend_matchmaking_notification(self, event):
		user_id = event['id']
		username = event['username']

		await self.send(text_data=json.dumps({
			'type': 'friend_matchmaking_notification',
			'id': user_id,
			'username': username,
		}))

	async def friend_tournament_notification(self, event):
		user_id = event['id']
		username = event['username']

		await self.send(text_data=json.dumps({
			'type': 'friend_tournament_notification',
			'id': user_id,
			'username': username,
		}))