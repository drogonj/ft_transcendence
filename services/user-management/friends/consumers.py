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
            await self.set_user_connected(self.user.id, True)
            await self.send(text_data=json.dumps({
                'message': f'Websocket connected as {self.user.username}, your id is {self.user.id}'
            }))
            await self.notify_connected_friends(self.user)
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'user'):
            await self.channel_layer.group_discard(
                f'user_{self.user.id}',
                self.channel_name
            )
            await self.set_user_connected(self.user.id, False)
            await self.notify_disconnected_friends(self.user)

    async def set_user_connected(self, user_id, is_connected):
        User = get_user_model()
        user = await User.objects.aget(id=user_id)
        user.is_connected = is_connected
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
                    'user_id': user.id,
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
                    'user_id': user.id,
                    'username': user.username
                }
            )

    async def friend_request_notification(self, event):
        # Accéder aux données envoyées
        from_user = event['from_user']
        avatar = event['avatar']

        # Envoyer les données au WebSocket
        await self.send(text_data=json.dumps({
            'type': 'friend_request_notification',
            'username': from_user,
            'avatar': avatar,
        }))

    async def accepted_friendship_request_notification(self, event):
        # Accéder aux données envoyées
        from_user = event['from_user']
        avatar = event['avatar']
        is_connected = event['is_connected']

        # Envoyer les données au WebSocket
        await self.send(text_data=json.dumps({
            'type': 'accepted_friendship_request_notification',
            'username': from_user,
            'avatar': avatar,
            'is_connected': is_connected,
        }))

    async def canceled_friendship_notification(self, event):
        # Accéder aux données envoyées
        from_user = event['from_user']
        avatar = event['avatar']

        # Envoyer les données au WebSocket
        await self.send(text_data=json.dumps({
            'type': 'canceled_friendship_notification',
            'username': from_user,
            'avatar': avatar,
        }))

    async def friend_connected_notification(self, event):
        user_id = event['user_id']
        username = event['username']

        # Envoyer les données au WebSocket
        await self.send(text_data=json.dumps({
            'type': 'friend_connected_notification',
            'user_id': user_id,
            'username': username,
        }))

    async def friend_disconnected_notification(self, event):
        user_id = event['user_id']
        username = event['username']

        # Envoyer les données au WebSocket
        await self.send(text_data=json.dumps({
            'type': 'friend_disconnected_notification',
            'user_id': user_id,
            'username': username,
        }))