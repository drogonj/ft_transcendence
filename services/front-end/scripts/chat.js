import { currentUser } from './auth.js';
import { loadUsers, updateUserStatus, getMuteListOf, getUserStatus} from './users.js';
import { bindGameSocket, launchFriendGame } from '../online-game-pong/websocket.js';

export var muteList = [];
export var chatCsrfToken = '';
export var chatSocket = null;
var rooms = new Set();

export async function getChatCsrfToken() {
	const response = await fetch('/api/chat/csrf/');
	const data = await response.json();
	chatCsrfToken = data.csrfToken;
}

export async function connectChatWebsocket(user_id, roomName) {
	if (!chatSocket) {
		chatSocket = new WebSocket(`wss://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/ws/chat/${roomName}/`);

		chatSocket.onopen = function(e) {
			console.log("Chat-WebSocket connection established.");
			joinRoom(`ID_${currentUser.user_id}`);
			joinRoom(roomName);
		};

		chatSocket.onmessage = function(e) {
			(async () => {
				const data = JSON.parse(e.data);
				let muted = false;

				if (data.timestamp)
					data.timestamp = formatTime(data.timestamp);

				console.log(data);

				if (muteList && muteList.includes(data.user_id))
					muted = true;

				if (data.type === 'user_status_update')
					updateUserStatus(data.user_id, data.is_connected, data.content);

				else if (data.type === 'private_message' && (data.receiver_id === currentUser.user_id
					|| data.user_id === currentUser.user_id))
						privateMessage(data);

				else if (data.type === 'invitation_to_play') {
						joinRoom(`invitation_${data.invitationId}`);
						invitationToPlay(data);
				}
				else if (data.type === 'invitation_response') {
					if (data.status === 'accepted')
						connectToGame(data);
					else if (data.status === 'declined')
						declinedInvitation(data);
				}

				else if (data.type === 'cancelled_invitation') {
					cancelledInvitation(data);
				}

				else if (data.type === 'system')
					systemMessage(data);

				else if (data.type === 'chat_message' && !muted)
					chatMessage(data);

				else if (data.type === 'troll_message' && !muted)
					trollMessage(data);
			})();
		}
	} else
		joinRoom(roomName);

	chatSocket.onclose = function(e) {
		if (e.wasClean)
			console.log(`[close] Chat Connection closed cleanly, code=${e.code} reason=${e.reason}`);
		else
			console.log('[close] Chat Connection died');
		leaveAllRooms();
		chatSocket = null;
	};

	chatSocket.onerror = function(error) {
		console.error(`[error] ${error.message}`);
	};
}

export async function disconnectChatWebsocket() {
	await leaveAllRooms();
    chatSocket.close();
	chatSocket = null;
}

async function 	connectToGame(data) {
	removePendingInvitationMessage(data.invitationId);
	bindGameSocket(new WebSocket(`wss://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/ws/back`));
	leaveRoom(`invitation_${data.invitationId}`);
	launchFriendGame(data);
}

async function declinedInvitation(data) {
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

	leaveRoom(`invitation_${data.invitationId}`);
}

async function cancelledInvitation(data) {
	removePendingInvitationMessage(data.invitationId);

	if (data.receiver_id === currentUser.user_id) {
		const messageList = document.getElementById('message-content');
		const newMessage = document.createElement('li');``
	
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.username} cancelled the invitation.`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}

	leaveRoom(`invitation_${data.invitationId}`);
}

async function removePendingInvitationMessage(invitationId) {
	const pendingMessageElement = document.getElementById(`pending-invitation-${invitationId}`);
	if (pendingMessageElement) {
		pendingMessageElement.remove();
	} else {
		console.log(`No pending invitation message found with ID: pending-invitation-${invitationId}`);
	}
}
async function joinRooms() {

}

async function joinRoom(roomName) {
	if (!rooms.has(roomName)) {
		chatSocket.send(JSON.stringify({
			type: 'join_room',
			room: roomName
		}));
		rooms.add(roomName);
	}
}

async function leaveRoom(roomName){
	if (!rooms.has(roomName)) {
		chatSocket.send(JSON.stringify({
			type: 'leave_room',
			room: roomName
		}));
	};
}

async function leaveAllRooms() {
	rooms.forEach(roomName => {
		chatSocket.send(JSON.stringify({
			type: 'leave_room',
			room: roomName
		}));
	});
	rooms.clear();
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

async function muteMessage(username, cmd) {
	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	newMessage.classList.add('chat-message');
	if (cmd === 'dm')
		newMessage.textContent = `DM not delivered to : ${username} (reason : muted).`;
	else if (cmd === 'play')
		newMessage.textContent = `Invitation not delivered to : ${username} (reason : muted).`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function chatMessage(data) {
	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	newMessage.classList.add('chat-message');
	newMessage.innerHTML = `${data.timestamp} ${data.username} : ${data.content}`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function systemMessage(data) {
	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	newMessage.classList.add('chat-message');
	newMessage.innerHTML = `${data.content}`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function privateMessage(data) {
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

function inviteConnectedUser(data) {
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
	} else if (data.user_id === currentUser.user_id) {
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

function inviteDisconnectedUser(data) {
	if (data.user_id === currentUser.user_id) {
		newMessage.classList.add('chat-message');
		newMessage.id = `pending-invitation-${data.invitationId}`;
		newMessage.innerHTML = `
			${data.receiver_username} is Offline... \
			<button class="cancel-button" data-invitation-id="${data.invitationId}">Cancel</button>
		`;
	
		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;

		newMessage.querySelector('.cancel-button').addEventListener('click', async () => handleCancel(data, newMessage));
	}
}

async function invitationToPlay(data) {
	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	// if (getUserStatus(data.receiver_id) === 'online')
		// inviteConnectedUser(data);
	// else if (getUserStatus(data.receiver_id) === 'offline')
		// inviteDisconnectedUser(data);
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
	muteList = await getMuteListOf(currentUser.user_id) || [];
	await getChatCsrfToken();
	await connectChatWebsocket(currentUser.user_id, 'general');
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
	newMessage.innerHTML = `Welcome to the chat ${currentUser.username}! <br> \
		For private message: "/dm username message" <br> \
		For private game: "/play username" \
	`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;

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

			try {
				const response = await fetch('/api/user/get_users/');
				const usersData = await response.json();

				for (const user of usersData.users) {
					const checkMute = await getMuteListOf(user.user_id);
					const amIMuted = checkMute.includes(currentUser.user_id);

					if (user.username === username) {
						if (user.username === currentUser.username) {
							let troll = getTrollMessage();
							chatSocket.send(JSON.stringify({
								'type': 'troll_message',
								'content': troll,
								'user_id': currentUser.user_id,
								'username': currentUser.username,
							}));
						}
						else if (!amIMuted && cmd === 'dm') {
							chatSocket.send(JSON.stringify({
								'type': 'private_message',
								'content': convertURL(parts.slice(2).join(' ')),
								'user_id': currentUser.user_id,
								'username': currentUser.username,
								'receiver_id': user.user_id,
								'receiver_username': user.username
							}));
						} else if (!amIMuted && cmd === 'play') {
							chatSocket.send(JSON.stringify({
								'room': `ID_${currentUser.user_id}`,
								'type': 'invitation_to_play',
								'user_id': currentUser.user_id,
								'username': currentUser.username,
								'receiver_id': user.user_id,
								'receiver_username': user.username
							}));
						} else
							muteMessage(user.username, cmd);
						return;
					}
				}
			} catch (error) {
				console.error('Error fetching users or processing message:', error);
			}
		} else {
			sendChatMessage(message);
		}
	} else {
		sendChatMessage(message);
	}
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

async function sendRoomMessage(data, status) {
	if (status === 'cancelled') {
		chatSocket.send(JSON.stringify({
			'room': `invitation_${data.invitationId}`,
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
			'room': `invitation_${data.invitationId}`,
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

export async function muteUser(userId) {
	try {
		const response = await fetch(`/api/user/mute_toggle/${userId}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': chatCsrfToken
			},
			body: JSON.stringify({ muted: true })
		});

		if (!response.ok) {
			throw new Error(`Network response was not ok. Status: ${response.status}`);
		}

		const result = await response.json();
		if (result.success) {
			muteList.push(Number(userId));
		} else {
			console.error('Failed to mute user:', result.message);
		}
	} catch (error) {
		console.error('Error muting user:', error);
	}
}

export async function unmuteUser(userId) {
	try {
		const response = await fetch(`/api/user/mute_toggle/${userId}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': chatCsrfToken
			},
			body: JSON.stringify({ muted: false })
		});

		if (!response.ok) {
			throw new Error(`Network response was not ok. Status: ${response.status}`);
		}

		const result = await response.json();
		if (result.success) {
			muteList = muteList.filter(id => id !== Number(userId));
		} else {
			console.error('Failed to unmute user:', result.message);
		}
	} catch (error) {
		console.error('Error unmuting user:', error);
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
	try {
		const response = await fetch('api/chat/invitations/');
		const data = await response.json();

		if (!data || data.length === 0)
			return;

		data.forEach(invit => {
			if (invit.status === 'pending') {
				if (invit.receiver_id === currentUser.user_id || invit.user_id === currentUser.user_id) {
					if (!muteList.includes(invit.user_id)) {
						joinRoom(`invitation_${invit.invitationId}`);
						invitationToPlay(invit);
					} else if (muteList.includes(invit.user_id))
						suppressInvitation(invit);
				}
			}			
			// else if (invit.status == 'on-hold') {
			// 	joinRoom(`invitation_${invit.invitationId}`);
			// 	invitationToPlay(invit);
			// }
		});
	} catch (error) {
		console.error('Error loading invitations:', error);
	}
}
