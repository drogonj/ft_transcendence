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

//chat.js
import { navigateTo, app } from './contentLoader.js';

let chatSocket = null;
let chatSocketRunning = false;

export async function connectChatWebsocket() {
	const response = await fetch('/api/user/info/');
	const userData = await response.json();

	const id = userData.user_id;
	const user = userData.username;

	const roomName = 'general';
	chatSocket = new WebSocket(`wss://localhost:8080/ws/chat/${roomName}/${id}/${user}/`);

	chatSocket.onopen = function(e) {
		chatSocketRunning = true;
		console.log("Chat WebSocket connection established.");
		chatSocket.send(JSON.stringify({
			'type': 'join_quit',
			'message': `${user} has joined the chat.`
		}));
	};

	chatSocket.onmessage = function(e) {
		const data = JSON.parse(e.data);
		const messageList = document.getElementById('message-content');
		const newMessage = document.createElement('li');

		if (data.type === 'join_quit') {
			newMessage.classList.add('chat-message');
			newMessage.textContent = data.timestamp + " " + data.message;
		} else if (data.type === 'message') {
			newMessage.classList.add('chat-message');
			newMessage.textContent = data.timestamp + " <" + data.username + "> " + data.message;
		}
		messageList.insertBefore(newMessage, messageList.firstChild);
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight
	};

	chatSocket.onclose = function(e) {
		chatSocketRunning = false;
		if (e.wasClean) {
			console.log(`[close] Chat Connection closed cleanly, code=${e.code} reason=${e.reason}`);
		} else {
			console.log('[close] Chat Connection died');
		}
	};

	chatSocket.onerror = function(error) {
		console.error(`[error] ${error.message}`);
	};
}

export async function loadUsers(selfId) {
	try {
		const response = await fetch('/api/chat/fetch_users/');
		const usersData = await response.json();

		for (const user of usersData.users) {
			if (user.id !== 1 && user.id !== selfId) {
				addUserToMenu(user.id, user.username, user.avatar, user.is_connected);
			}
		}

	} catch (error) {
		console.error('Error loading users:', error);
	}
}

export function addUserToMenu(userID, username, avatar, is_connected) {
	const usersContainer = document.getElementById('users-content');

	const newUser = document.createElement('li');
	newUser.id = `user-${userID}`;

	newUser.innerHTML = `
		<div class="status-indicator ${is_connected ? 'online' : 'offline'}"></div>
		<div class="avatar-container">
			<img class="avatar" src="${avatar}" alt="${username}'s Avatar">
		</div>
		<span class="profile-link" data-user-id="${userID}">
			<p>${username}</p>
		</span>
		<button class="mute-user-button" data-user-id="${userID}">
			<img src="../assets/images/chat/chat_icon.png" alt="mute">
		</button>
	`;

	usersContainer.insertAdjacentElement('beforeend', newUser);

	//changeUserStatus(userID, is_connected);

	newUser.querySelector('.mute-user-button').addEventListener('click', async (event) => {
		await muteUser(event);
	});

	newUser.querySelector('.profile-link').addEventListener('click', async function (event) {
		 const userId = this.getAttribute('data-user-id');
		 const uri = '/profile/' + userId + '/';
		 navigateTo(uri, true);
	});
}

export async function renderChatApp(user_id, username) {
	await connectChatWebsocket();
	app.innerHTML += `
		<div id="users-list" class="users-list">
		<div class="users-title">Users</div>
			<ul id="users-content" class="users-content active"></ul>
		</div>
		<div id="chat-menu" class="chat-menu">
			<div id="chat-messages" class="chat-messages">
				<ul id="message-content" class="message-content active"></ul>
			</div>
			<div id="chat-input-container" class="chat-input-container">
				<input id="chat-input" type="text" placeholder="Type a message...">
				<button id="send-chat-message" class="send-chat-message">Send</button>
			</div>
		</div>
	`;

	document.getElementById('chat-input').focus();
	document.getElementById('chat-input').onkeyup = function(e) {
		if (KeyboardEvent.keyCode === 13) {
			document.getElementById('send-chat-message').click();
		}
	};

	document.getElementById('send-chat-message').onclick = function(e) {
		const messageInputDom = document.getElementById('chat-input');
		const message = messageInputDom.value;
		chatSocket.send(JSON.stringify({
			'message': message,
			'user_id': user_id,
			'username': username
		}));
		messageInputDom.value = '';
	};
}

export function changeUserStatus(userId, is_connected) {
    let userElement = document.getElementById(`user-${userId}`);
    if (userElement) {
        const statusIndicator = userElement.querySelector('.status-indicator');
        const statusIndicatorText = userElement.querySelector('.status-indicator-text');

        if (statusIndicator) {
            statusIndicator.classList.remove('offline', 'online');
            statusIndicator.classList.add(is_connected ? 'online' : 'offline');
        }

        if (statusIndicatorText) {
            statusIndicatorText.textContent = is_connected ? 'online' : 'offline';
        }
    }
	
}

//models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class Message(models.Model):
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)
	content = models.TextField()
	timestamp = models.DateTimeField(auto_now_add=True)
	room_name = models.CharField(max_length=255)


class systemMessage(models.Model):
	username = models.CharField(max_length=255)
	timestamp = models.DateTimeField(auto_now_add=True)
	room_name = models.CharField(max_length=255)

# class CustomUser(AbstractUser):
# 	muted_users = models.ManyToManyField('self', symmetrical=False, related_name='muted_by')


//consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message, systemMessage
from asgiref.sync import sync_to_async
from django.utils.timezone import now

class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		# Extraire les paramètres d'URL correctement
		self.room_name = self.scope['url_route']['kwargs']['roomName']
		self.user_id = self.scope['url_route']['kwargs']['id']
		self.username = self.scope['url_route']['kwargs']['user']
		self.room_group_name = f'chat_{self.room_name}'
	
		# Ajouter le canal du WebSocket au groupe de la salle de chat
		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		# Accepter la connexion WebSocket
		await self.accept()

		# Envoyer une notification que l'utilisateur a rejoint le chat
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'join_quit',
				'message': f'{self.username} has joined the chat.',
				'user_id': self.user_id,
				'username': self.username,
				'timestamp': now().strftime('%H:%M:%S')
			}
		)

	async def disconnect(self, close_code):
		# Retirer le canal du WebSocket du groupe de la salle de chat
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

		# Envoyer une notification que l'utilisateur a quitté le chat
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'chat_message',
				'message': f'{self.username} has left the chat.',
				'user_id': self.user_id,
				'username': self.username,
				'timestamp': now().strftime('%H:%M:%S')
			}
		)

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json.get('message', '')
		user_id = text_data_json.get('user_id', self.user_id)
		username = text_data_json.get('username', self.username)

		# Sauvegarder le message dans la base de données
		new_message = await sync_to_async(Message.objects.create)(
			user_id=user_id,
			username=username,
			content=message,
			timestamp=now(),
			room_name=self.room_name
		)

		# Envoyer le message au groupe de la salle de chat
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'chat_message',
				'message': message,
				'user_id': user_id,
				'username': username,
				'timestamp': new_message.timestamp.strftime('%H:%M:%S')
			}
		)

	async def chat_message(self, event):
		message = event['message']
		user_id = event['user_id']
		username = event['username']
		timestamp = event['timestamp']

		# Envoyer le message au WebSocket
		await self.send(text_data=json.dumps({
			'message': message,
			'user_id': user_id,
			'username': username,
			'timestamp': timestamp
		}))

	async def join_quit(self, event):
		message = event['message']
		user_id = event['user_id']
		username = event['username']
		timestamp = event['timestamp']

		# Envoyer le message au WebSocket
		await self.send(text_data=json.dumps({
			'message': message,
			'user_id': user_id,
			'username': username,
			'timestamp': timestamp
		}))

//webchat/routing.py
from django.urls import re_path
from .consumers import ChatConsumer

websocket_urlpatterns = [
	re_path(r'ws/chat/(?P<roomName>\w+)/(?P<id>\w+)/(?P<user>\w+)', ChatConsumer.as_asgi()),
]
		