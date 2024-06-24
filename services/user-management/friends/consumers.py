# friends/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

from channels.generic.websocket import AsyncWebsocketConsumer
import json

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

    async def receive(self, text_data):
        # Logique pour traiter les messages reçus si nécessaire
        pass

    async def friend_request_notification(self, event):
        # Envoie le message de notification au client WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))
