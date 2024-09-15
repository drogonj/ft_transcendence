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

class c_user:
	def __init__(self, id):
		self.id = id
		self.running_games = 0  # Number of running games

def get_c_user(id):
	for user in connected_users:
		if user.id == id:
			return user
	return None

def set_c_user_running_games(id, value):
	user = get_c_user(id)
	if user is None:
		return
	new_value = user.running_games + value
	channel_layer = get_channel_layer()
	logger.info(f'User {user.id} running games: {new_value}, previous: {user.running_games}')
	if new_value <= 0 and user.running_games > 0:
		logger.info(f'set_c_user_running_games: {user.id} is now online')
		async_to_sync(change_and_notify_user_status)(channel_layer, get_user_model().objects.get(id=id), 'online')
	elif new_value > 0 and user.running_games <= 0:
		logger.info(f'set_c_user_running_games: {user.id} is now in-game')
		async_to_sync(change_and_notify_user_status)(channel_layer, get_user_model().objects.get(id=id), 'in-game')
	user.running_games = new_value

user_lock = asyncio.Lock()

async def change_and_notify_user_status(channel_layer, user, status):
	connected_friends = await sync_to_async(Friendship.objects.get_connected_friends)(user)

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
	else:
		logger.error(f'Friends Notification Bad Type: {status}')
		return
	await sync_to_async(user.save)()

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
			if self.user.active_connections > 0 and not self.user.is_connected:
				connected_users.add(c_user(self.user.id))
				await self.notify_chat_user_connected(self.user)
				await change_and_notify_user_status(self.channel_layer, self.user, 'online')
			elif self.user.active_connections <= 0:
				user = get_c_user(self.user.id)
				if user:
					connected_users.discard(user)
				await self.notify_chat_user_disconnected(self.user)
				await change_and_notify_user_status(self.channel_layer, self.user, 'offline')
			await sync_to_async(self.user.save)()
			await sync_to_async(self.user.refresh_from_db)()

	async def close_websocket(self, event):
		await self.close()

	async def receive(self, text_data):
		logger.info(f'Websocket received: {text_data}')

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