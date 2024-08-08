import { currentUser } from './auth.js';
import { loadUsers, updateUserStatus, getMuteListOf, isUserMuted } from './users.js';

let chatSocket = null;
let chatSocketRunning = false;

// Quelques points verifier:
// Attention a la prise en compte de ADMIN et de son ID dans le chat et les rooms (choix de config)
// Check la configuration CACHE/DATABASE dans settings.py et du coup la sauvegarde des messages
// ==> REDIS:6379/1 pour le cache (voir si besoin d'une adresse 0 et/ou definir si juste redis:6379 pour DB)

export async function connectChatWebsocket(user_id) {
	if (chatSocket)
		return;

	const roomName = 'general';
	chatSocket = new WebSocket(`wss://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/ws/chat/${roomName}/${user_id}/`);

	chatSocket.onopen = function(e) {
		chatSocketRunning = true;
		console.log("Chat WebSocket connection established.");
	};

	chatSocket.onmessage = function(e) {
		(async () => {
			const data = JSON.parse(e.data);
			console.log(data);

			const muted = await isUserMuted(data.user_id);

			if (data.type === 'user_status_update')
				updateUserStatus(data.user_id, data.is_connected, data.timestamp, data.content);
			else if (data.type === 'private_message') {
				const isSenderMuted = await getMuteListOf(data.receiver_id);
				console.log(`sender has muted you: ${muted}`);
				if  (!muted && !isSenderMuted && data.receiver_id !== data.user_id)
					private_message(data);
				else if (isSenderMuted && currentUser.user_id === data.user_id)
					muted_message(data);
				else if (data.receiver_id === data.user_id )
					troll_message(data);
			}
			else if (data.type === 'chat_message' && !muted)
				chat_message(data);
		})();
	};

	chatSocket.onclose = function(e) {
		chatSocketRunning = false;
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
				console.log('Sending private message to:', username);
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

// async function saveMessages(user_id, message) {
// 	try {
// 		const response = await fetch(`/api/user/messages/${user_id}/`, {
// 			method: 'POST',
// 			headers: {
// 				'Content-Type': 'application/json',
// 				'X-CSRFToken': csrfToken
// 			},
// 			body: JSON.stringify({ savedMessages: message })
// 		});

// 		if (!response.ok) {
// 			throw new Error(`Network response was not ok. Status: ${response.status}`);
// 		}
// 	} catch (error) {
// 			console.error('Error updating mute state:', error.message);
// 	};
// }