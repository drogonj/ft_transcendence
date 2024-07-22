# friends/consumers.py
import os
import django
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user-management.settings')
django.setup()

from .models import Friendship

class FriendRequestConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_authenticated:
            # Ajoute l'utilisateur au groupe correspondant à son ID
            await self.channel_layer.group_add(
                f'user_{self.user.id}',
                self.channel_name
            )
            await self.accept()
            await self.set_active_connection(self.user.id, 1) # Adding an active connection to user's session
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
            await self.set_active_connection(self.user.id, -1) # Removing an active connecion to user's session

    async def set_active_connection(self, user_id, value):
        User = get_user_model()
        user = await User.objects.aget(id=user_id)
        user.active_connections += value
        if user.active_connections > 0 and not user.is_connected:
            user.is_connected = True
            await self.notify_connected_friends(self.user)
        elif user.active_connections <= 0:
            user.is_connected = False
            await self.notify_disconnected_friends(self.user)
        await user.asave()

    async def receive(self, text_data):
        # Logique pour traiter les messages reçus si nécessaire
        pass

    async def notify_connected_friends(self, user):
        connected_friends = await sync_to_async(Friendship.objects.get_connected_friends)(user)
        for friend in connected_friends:
            group_name = f'user_{friend.id}'
            await self.channel_layer.group_send(
                group_name,
                {
                    'type': 'friend_connected_notification',
                    'id': user.id,
                    'username': user.username
                }
            )

    async def notify_disconnected_friends(self, user):
        connected_friends = await sync_to_async(Friendship.objects.get_connected_friends)(user)
        for friend in connected_friends:
            group_name = f'user_{friend.id}'
            await self.channel_layer.group_send(
                group_name,
                {
                    'type': 'friend_disconnected_notification',
                    'id': user.id,
                    'username': user.username
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