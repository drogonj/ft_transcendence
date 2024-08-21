import { currentUser } from './auth.js';
import { loadUsers, updateUserStatus, getMuteListOf} from './users.js';

export var muteList = [];

var chatSocket = null;

// TODO LIST: First at bottom
// Check la configuration CACHE/DATABASE dans settings.py et du coup la sauvegarde des messages
// ==> REDIS:6379/1 pour le cache (voir si besoin d'une adresse 0 et/ou definir si juste redis:6379 pour DB)

// CHAT CONTAINER :
// - Creer un nouveau system de gestion container try/catch :POST
// - Ajoute dans : document.addEventListener('DOMContentLoaded', async function () la connectChatWebsocket
// - Recuperer les donnes aussi et les postes dans la table user de chat (creation models users_chat)
// - ajouter une variable list pour chaque user
// - Suscribe/PUB : https://redis.io/docs/latest/develop/interact/pubsub/

export async function connectChatWebsocket(user_id) {
	if (chatSocket)
		return;

	const roomName = 'general';
	chatSocket = new WebSocket(`wss://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/ws/chat/${roomName}/${user_id}/`);

	chatSocket.onopen = function(e) {
		console.log("Chat-WebSocket connection established.");
	};

	chatSocket.onmessage = function(e) {
		(async () => {
			const data = JSON.parse(e.data);
			let muted = false;
			console.log(data);

			data.timestamp = formatTime(data.timestamp);

			if (muteList && muteList.includes(data.user_id))
				muted = true;

			if (data.type === 'user_status_update')
				updateUserStatus(data.user_id, data.is_connected, data.timestamp, data.content);
			else if (data.type === 'private_message') {
				const receiverList = await getMuteListOf(data.receiver_id);
				const amIMuted = receiverList.includes(currentUser.user_id);

				if  (!muted && !amIMuted && data.receiver_id !== data.user_id)
					private_message(data);
				else if (amIMuted && currentUser.user_id === data.user_id)
					muted_message(data);
				else if (data.receiver_id === data.user_id )
					troll_message(data);
			}
			else if (data.type === 'chat_message' && !muted)
				chat_message(data);
		})();
	};

	chatSocket.onclose = function(e) {
		if (e.wasClean)
			console.log(`[close] Chat Connection closed cleanly, code=${e.code} reason=${e.reason}`);
		else
			console.log('[close] Chat Connection died');
	};

	chatSocket.onerror = function(error) {
		console.error(`[error] ${error.message}`);
	};
}

export async function troll_message(data) {
	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');
	const random = Math.floor(Math.random() * 5);
	let content = [];

	if (data.user_id === currentUser.user_id) {
		content = [
			'Ain\'t you a narcissist?',
			'Dude, you need some help... seriously.',
			'Ain\'t you a bit lonely?',
			'Get out, find some friends!',
			'I mean... you could just... not do that?',
		]
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.timestamp} ${content[random]}`;
	} else {
		content = [
			'God bless this poor soul.',
			'Guys, please, just talk to him/her!',
			'Seems like nobody loves him/her.',
			'You know what to do!',
			'Just leave quielty...',
		]
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.timestamp} ${data.username} talk to him/herself: ${content[random]}`;
	}
	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

export async function muted_message(data) {
	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');
 
	newMessage.classList.add('chat-message');
	newMessage.textContent = `${data.timestamp} DM not delivered to : ${data.receiver_username} (reason : muted).`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;

	fet
}

export async function chat_message(data) {
	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	newMessage.classList.add('chat-message');
	newMessage.textContent = `${data.timestamp} ${data.username} : ${data.content}`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

export async function private_message(data) {
	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	if (data.receiver_id === currentUser.user_id) {
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.timestamp} DM from ${data.username} : ${data.content}`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
	if (data.user_id === currentUser.user_id) {
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.timestamp} DM to ${data.receiver_username} : ${data.content}`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
}

export async function addChatMenu() {
	muteList = await getMuteListOf(currentUser.user_id) || [];
	await connectChatWebsocket(currentUser.user_id);
    const chatContainer = document.querySelector('.chat-menu-container');
    chatContainer.innerHTML = `
		<div id="chat-menu-container" class="chat-menu-container">
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
		</div>
	`;

	await loadUsers();
	await loadMessages();

	document.getElementById('chat-input').focus();
	document.getElementById('chat-input').onkeydown = function(e) {
		if (e.key === 'Enter') {
			document.getElementById('send-chat-message').click();
		}
	};

	document.getElementById('send-chat-message').onclick = async function(e) {
		const messageInputDom = document.getElementById('chat-input');
		const message = messageInputDom.value;

		if (!message.trim()) {
			return;
		} else { 
			parseMessage(message);
			messageInputDom.value = '';
		};
	}
}

async function parseMessage(message) {
	if (message.startsWith('/')) {
		const parts = message.split(' ');
		if (parts.length >= 2) {
			const cmd = parts[0].slice(1);
			const username = parts[1];
			const messageContent = parts.slice(2).join(' ');
			console.log('messageContent: ', messageContent);

			if (cmd === 'private') {
				const response = await fetch('/api/user/get_users/');
				const usersData = await response.json();

				for (const user of usersData.users) {
					if (user.username === username) {
						chatSocket.send(JSON.stringify({
							'type': 'private_message',
							'content': messageContent,
							'user_id': currentUser.user_id,
							'username': currentUser.username,
							'receiver_id': user.user_id,
							'receiver_username': user.username
						}));
						return ;
					}
				}
			} else if (cmd === 'invite') {
				// TODO : Implement invite command
			}
		} else {
			sendChatMessage(message);
		}
	} else {
		sendChatMessage(message);
	}
	return ;
}

async function sendChatMessage(message) {
	chatSocket.send(JSON.stringify({
		'type': 'chat_message',
		'content': message,
		'user_id': currentUser.user_id,
		'username': currentUser.username
	}));
}

export async function muteUser(userId) {
	muteList.push(userId);
}

export async function unmuteUser(userId) {
	muteList = muteList.filter(id => id !== userId);
}

async function loadMessages() {
	try {
		const response = await fetch('api/chat/all-messages/');
		const data = await response.json();

		let allMessages = [
			...data.messages,
			...data.private_messages,
		];

		if (!allMessages || allMessages.length === 0) {
			return;
		}

		allMessages.sort((first, second) => new Date(first.timestamp) - new Date(second.timestamp));

		allMessages.forEach(message => {
			console.log('message:', message.user_id, typeof message.user_id);
			console.log(muteList.includes(message.user_id));
			if (!muteList.includes(message.user_id)) {
				if (message.type === 'private_message')
					load_private_message(message);
				else if (message.type === 'chat_message')
					load_message(message);
			}
		});
	} catch (error) {
		console.error('Error loading messages:', error);
	}
}

export function formatTime(timestamp) {
	const date = new Date(timestamp);

	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');

	return `${hours}:${minutes}:${seconds}`;
}

export async function load_message(data) {
	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');
	data.timestamp = formatTime(data.timestamp);

	newMessage.classList.add('chat-message');
	newMessage.textContent = `${data.timestamp} ${data.username} : ${data.content}`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

export async function load_private_message(data) {
	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');
	data.timestamp = formatTime(data.timestamp);


	if (data.receiver_id === currentUser.user_id) {
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.timestamp} DM from ${data.username} : ${data.content}`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
	if (data.user_id === currentUser.user_id) {
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.timestamp} DM to ${data.receiver_username} : ${data.content}`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
}