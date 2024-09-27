import { currentUser } from './auth.js';
import { launchClientGame } from '../online-game-pong/websocket.js';
import { loadUsers, updateUserStatus, getMuteListOf } from './users.js';

export var chatCsrfToken = '';
export var chatSocket = null;

export async function getChatCsrfToken() {
	const response = await fetch('/api/chat/csrf/');
	const data = await response.json();
	chatCsrfToken = data.csrfToken;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function connectChatWebsocket(roomName) {
	if (!chatSocket) {
		chatSocket = new WebSocket(`wss://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/ws/chat/${roomName}/`);

		chatSocket.onopen = function(e) {
			console.log("Chat-WebSocket connection established.");
		};

		chatSocket.onmessage = function(e) {
			(async () => {
				const data = JSON.parse(e.data);

				if (data.timestamp)
					data.timestamp = formatTime(data.timestamp);

				console.log(data);

				if (data.type === 'user_status_update')
					updateUserStatus(data.user_id, data.status, data.content);

				else if (data.type === 'private_message')
					privateMessage(data);

				else if (data.type === 'invitation_to_play')
					invitationToPlay(data);

				else if (data.type === 'invitation_response') {
					if (data.status === 'accepted')
						connectToGame(data);
					else if (data.status === 'declined')
						declinedInvitation(data);
				}

				else if (data.type === 'cancelled_invitation')
					cancelledInvitation(data);

				else if (data.type === 'system')
					systemMessage(data);

				else if (data.type === 'game_message')
					gameMessage(data);

				else if (data.type === 'chat_message')
					chatMessage(data);

				else if (data.type === 'troll_message')
					trollMessage(data);

				else if (data.type === 'error')
					error(data)
			})();
		}

		chatSocket.onclose = function(e) {
			if (e.wasClean)
				console.log(`[close] Chat Connection closed cleanly, code=${e.code} reason=${e.reason}`);
			else
				console.log('[close] Chat Connection died');
			chatSocket = null;
		};

		chatSocket.onerror = function(error) {
			console.error(`[error] ${error.message}`);
		};
	}
}

export async function disconnectChatWebsocket() {
	chatSocket.close();
	chatSocket = null;
}

async function 	connectToGame(data) {
	if (data.receiver_id === currentUser.user_id)
		removePendingInvitationMessage(data.invitationId);
	launchClientGame(data);
}

async function declinedInvitation(data) {
	if (!chatWindowOn())
		return ;

	if (data.receiver_id === currentUser.user_id) {
		removePendingInvitationMessage(data.invitationId); 

		const messageList = document.getElementById('message-content');
		const newMessage = document.createElement('li');``
	
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.username} declined your invitation.`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
}

async function cancelledInvitation(data) {
	if (!chatWindowOn())
		return ;

	if (data.status === 'offline' || data.status === 'in-game'){
		const messageList = document.getElementById('message-content');
		const newMessage = document.createElement('li');
	
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.username} cancelled the invitation (Reason: ${data.status}).`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
		return ;
	}
	else {
		removePendingInvitationMessage(data.invitationId);
		if (data.receiver_id === currentUser.user_id) {
			const messageList = document.getElementById('message-content');
			const newMessage = document.createElement('li');
		
			newMessage.classList.add('chat-message');
			newMessage.textContent = `${data.username} cancelled the invitation (Reason: ${data.status}).`;

			messageList.insertBefore(newMessage, messageList.firstChild);
			
			const chatMessages = document.getElementById('chat-messages');
			chatMessages.scrollTop = chatMessages.scrollHeight;
		}
	}
}

async function removePendingInvitationMessage(invitationId) {
	if (!chatWindowOn())
		return ;

	const pendingMessageElement = document.getElementById(`pending-invitation-${invitationId}`);

	if (pendingMessageElement)
		pendingMessageElement.remove();
	else
		console.log(`No pending invitation message found with ID: pending-invitation-${invitationId}`);
}

function getTrollMessage() {
	const random = Math.floor(Math.random() * 5);
	let content = [
		'Ain\'t you a narcissist?',
		'Dude, you need some help... seriously.',
		'Ain\'t you a bit lonely?',
		'Get out, find some friends!',
		'I mean... you could just... not do that?',
	]
	return content[random];
}

export async function trollMessage(data) {
	if (!chatWindowOn())
		return ;

	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');
	const random = Math.floor(Math.random() * 5);
	let content = [];

	if (data.user_id === currentUser.user_id) {
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.content}`;
	} else {
		content = [
			'God bless this poor soul.',
			'Guys, please, just talk to him/her/it!',
			'Seems like nobody loves him/her/it.',
			'You know what to do!',
			'***leaving quietly***',
		]
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.username} talk to him/her/itself: ${content[random]}`;
	}
	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function chatMessage(data) {
	if (!chatWindowOn())
		return ;

	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	newMessage.classList.add('chat-message');
	newMessage.innerHTML = `${data.timestamp} ${data.username} : ${data.content}`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function systemMessage(data) {
	if (!chatWindowOn())
		return ;

	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	newMessage.classList.add('chat-message');
	newMessage.innerHTML = `${data.content}`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function gameMessage(data) {
	if (!chatWindowOn())
		return ;

	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	newMessage.classList.add('game-chat-message');
	newMessage.innerHTML = `${data.content}`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function privateMessage(data) {
	if (!chatWindowOn())
		return ;

	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	if (data.receiver_id === currentUser.user_id) {
		newMessage.classList.add('chat-message');
		newMessage.innerHTML = `${data.timestamp} DM from ${data.username} : ${data.content}`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
	if (data.user_id === currentUser.user_id) {
		newMessage.classList.add('chat-message');
		newMessage.innerHTML = `${data.timestamp} DM to ${data.receiver_username} : ${data.content}`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
}

async function invitationToPlay(data) {
	if (!chatWindowOn())
		return ;

	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	if (data.receiver_id === currentUser.user_id) {
		newMessage.classList.add('chat-message');
		newMessage.id = `pending-invitation-${data.invitationId}`;
		newMessage.innerHTML = `
			Invited to play with ${data.username} : \
			<button class="accept-button" data-invitation-id="${data.invitationId}">Accept</button> / \
			<button class="decline-button" data-invitation-id="${data.invitationId}">Decline</button>
		`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;

		newMessage.querySelector('.accept-button').addEventListener('click', async () => handleAccept(data, newMessage));
		newMessage.querySelector('.decline-button').addEventListener('click', async () => handleDecline(data, newMessage));
	}
	if (data.user_id === currentUser.user_id) {
		newMessage.classList.add('chat-message');
		newMessage.id = `pending-invitation-${data.invitationId}`;
		newMessage.innerHTML = `
			Waiting for ${data.receiver_username}... \
			<button class="cancel-button" data-invitation-id="${data.invitationId}">Cancel</button>
		`;
	
		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;

		newMessage.querySelector('.cancel-button').addEventListener('click', async () => handleCancel(data, newMessage));
	}
}

async function handleAccept(data, message) {
	message.remove();
	await fetch(`/api/chat/invitations/accepted/${data.invitationId}/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': chatCsrfToken
		},
		body: JSON.stringify({'status': 'accepted'})
		});
	sendRoomMessage(data, 'accepted');
}

export async function handleDecline(data, message) {
	if (message)
		message.remove();
	await fetch(`/api/chat/invitations/declined/${data.invitationId}/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': chatCsrfToken
		},
		body: JSON.stringify({'status': 'declined'})
		});	
	sendRoomMessage(data, 'declined');
}

export async function handleCancel(data, message) {
	message.remove();
	await fetch(`/api/chat/invitations/cancelled/${data.invitationId}/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': chatCsrfToken
		},
		body: JSON.stringify({'status': 'cancelled'})
		});
	sendRoomMessage(data, 'cancelled');
}

export async function addChatMenu() {
	await connectChatWebsocket('general');
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
					<input id="chat-input" type="text" maxlength="200" placeholder="Type a message...">
					<button id="send-chat-message" class="send-chat-message">Send</button>
				</div>
			</div>
		</div>
	`;

	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	newMessage.classList.add('chat-message');
	newMessage.innerHTML = `Welcome ${currentUser.username}! <br> \
		For private message: "/dm username message" <br> \
		For private game: "/play username" \
	`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;

	await sleep(200);
	await getChatCsrfToken();
	await loadUsers();
	await loadMessages();
	await loadInvitations();

	document.getElementById('chat-input').focus();
	document.getElementById('chat-input').onkeydown = function(e) {
		if (e.key === 'Enter') {
			document.getElementById('send-chat-message').click();
		}
	};

	document.getElementById('send-chat-message').onclick = async function(e) {
		const messageInputDom = document.getElementById('chat-input');
		const message = messageInputDom.value;

		if (!message.trim())
			return;
		else { 
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

			if (cmd === 'game'){
				chatSocket.send(JSON.stringify({
					'type': 'game_message',
					'content': convertURL(parts.slice(1).join(' ')),
				}));

				return ;
			}

			try {
				const response = await fetch('/api/user/get_users/');
				const usersData = await response.json();

				for (const user of usersData.users) {
					if (user.username === username) {
						console.log(`User: ${user.username}`)
						if (user.username === currentUser.username) {
							let troll = getTrollMessage();
							chatSocket.send(JSON.stringify({
								'type': 'troll_message',
								'content': troll,
								'user_id': currentUser.user_id,
								'username': currentUser.username,
							}));
						}
						else if (cmd === 'dm') {
							chatSocket.send(JSON.stringify({
								'type': 'private_message',
								'content': convertURL(parts.slice(2).join(' ')),
								'user_id': currentUser.user_id,
								'username': currentUser.username,
								'receiver_id': user.user_id,
								'receiver_username': user.username
							}));
						} else if (cmd === 'play') {
							chatSocket.send(JSON.stringify({
								'room': `ID_${currentUser.user_id}`,
								'type': 'invitation_to_play',
								'user_id': currentUser.user_id,
								'username': currentUser.username,
								'receiver_id': user.user_id,
								'receiver_username': user.username
							}));
						}
					}
				}
			} catch (error) {
				console.error('Error fetching users or processing message:', error);
			}
		}
	} else
		sendChatMessage(message);
}

function convertURL(text) {
	const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
	return text.replace(urlPattern, function(url) {
		return `<a href="${url}" target="_blank">${url}</a>`;
	});
}

async function sendChatMessage(message) {
	chatSocket.send(JSON.stringify({
		'type': 'chat_message',
		'content': convertURL(message),
		'user_id': currentUser.user_id,
		'username': currentUser.username
	}));
}

export async function sendSystemMessage(message) {
	chatSocket.send(JSON.stringify({
		'type': 'system',
		'content': convertURL(message),
		'user_id': currentUser.user_id,
		'username': currentUser.username
	}));
}

export async function sendGameMessage(message) {
	chatSocket.send(JSON.stringify({
		'type': 'tournament_call',
		'content': convertURL(message),
		'user_id': currentUser.user_id,
		'username': currentUser.username
	}));
}

async function sendRoomMessage(data, status) {
	if (status === 'cancelled') {
		chatSocket.send(JSON.stringify({
			'type': 'cancelled_invitation',
			'invitationId': data.invitationId,
			'status': status,
			'receiver_id': data.receiver_id,
			'receiver_username': data.receiver_username,
			'user_id': data.user_id,
			'username': data.username
		}));
	} else {
		chatSocket.send(JSON.stringify({
			'type': 'invitation_response',
			'invitationId': data.invitationId,
			'status': status,
			'receiver_id': data.user_id,
			'receiver_username': data.username,
			'user_id': data.receiver_id,
			'username': data.receiver_username
		}));
	}
}

async function loadMessages() {
	try {
		const response = await fetch('api/chat/messages/');
		const data = await response.json();

		let allMessages = [
			...data.messages,
			...data.private_messages,
		];

		if (!allMessages || allMessages.length === 0) {
			return;
		}

		allMessages.sort((first, second) => new Date(first.timestamp) - new Date(second.timestamp));

		const muteList = await getMuteListOf(currentUser.user_id);
		allMessages.forEach(message => {
			if (!muteList.includes(message.user_id)) {
				if (message.type === 'private_message')
					loadAPrivateMessage(message);
				else if (message.type === 'chat_message')
					loadAMessage(message);
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

export async function loadAMessage(data) {
	if (!chatWindowOn())
		return ;

	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');
	data.timestamp = formatTime(data.timestamp);

	newMessage.classList.add('chat-message');
	newMessage.innerHTML = `${data.timestamp} ${data.username} : ${data.content}`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

export async function loadAPrivateMessage(data) {
	if (!chatWindowOn())
		return ;

	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');
	data.timestamp = formatTime(data.timestamp);

	if (data.receiver_id === currentUser.user_id) {
		newMessage.classList.add('chat-message');
		newMessage.innerHTML = `${data.timestamp} DM from ${data.username} : ${data.content}`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
	if (data.user_id === currentUser.user_id) {
		newMessage.classList.add('chat-message');
		newMessage.innerHTML = `${data.timestamp} DM to ${data.receiver_username} : ${data.content}`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
}

async function loadInvitations() {
	if (!chatWindowOn())
		return ;

	try {
		const response = await fetch('api/chat/invitations/');
		const data = await response.json();

		if (!data || data.length === 0)
			return;

		const muteList = await getMuteListOf(currentUser.user_id);

		data.forEach(invit => {
			if (invit.status === 'pending') {
				if (invit.receiver_id === currentUser.user_id || invit.user_id === currentUser.user_id) {
					if (!muteList.includes(invit.user_id))
						invitationToPlay(invit);
					else
						handleDecline(invit, null)
				}
			}			
		});
	} catch (error) {
		console.error('Error loading invitations:', error);
	}
}

function chatWindowOn() {
	const chatMessages = document.getElementById('chat-messages');
	if (!chatMessages)
		return false;
	return true;
}

async function error(data) {
	if (!chatWindowOn())
		return ;

	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	newMessage.classList.add('chat-message');
	newMessage.innerHTML = `${data.content}`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}