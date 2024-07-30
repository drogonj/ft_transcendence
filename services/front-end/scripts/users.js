// webchat/routing.py
from django.urls import re_path
from .consumers import ChatConsumer, ListUsersConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/users/', ListUsersConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<room_name>\w+)/$', ChatConsumer.as_asgi()),
]

// apps.py
from django.apps import AppConfig

class YourAppConfig(AppConfig):
    name = 'your_app'

    def ready(self):
        import your_app.signals

		# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
import redis

# Connect to Redis
redis_instance = redis.StrictRedis(host='localhost', port=6379, db=0)

class ListUsersConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_authenticated:
            await self.channel_layer.group_add(
                f'user_{self.user.id}',
                self.channel_name
            )
            await self.accept()
            redis_instance.set(f'user_{self.user.id}_status', 'online')
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
            redis_instance.set(f'user_{self.user.id}_status', 'offline')

    async def receive(self, text_data):
        pass

    async def friend_connected_notification(self, event):
        user_id = event['id']
        username = event['username']
        status = redis_instance.get(f'user_{user_id}_status').decode('utf-8')

        await self.send(text_data=json.dumps({
            'type': 'friend_connected_notification',
            'id': user_id,
            'username': username,
            'status': status
        }))

    async def friend_disconnected_notification(self, event):
        user_id = event['id']
        username = event['username']
        status = redis_instance.get(f'user_{user_id}_status').decode('utf-8')

        await self.send(text_data=json.dumps({
            'type': 'friend_disconnected_notification',
            'id': user_id,
            'username': username,
            'status': status
        }))

//signals.py
from django.db.models.signals import post_save, post_delete
from django.contrib.auth.models import User
from django.dispatch import receiver
import redis

# Connect to Redis
redis_instance = redis.StrictRedis(host='localhost', port=6379, db=0)

@receiver(post_save, sender=User)
def user_logged_in(sender, instance, **kwargs):
    if instance.is_authenticated:
        redis_instance.set(f'user_{instance.id}_status', 'online')

@receiver(post_delete, sender=User)
def user_logged_out(sender, instance, **kwargs):
    redis_instance.set(f'user_{instance.id}_status', 'offline')
