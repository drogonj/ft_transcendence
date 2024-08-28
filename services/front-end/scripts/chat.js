import { currentUser } from './auth.js';
import { loadUsers, updateUserStatus, getMuteListOf} from './users.js';
import { bindGameSocket, launchFriendGame } from '../online-game-pong/websocket.js';

export var muteList = [];
export var chatCsrfToken = '';
export var chatSocket = null;
var rooms = new Set();

// TODO:
// - si l'utilisateur est deja en game, a voir ce qu'on fait
// - Deconnexion chatSocket a verifier sur page login avec reco

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
			joinRoom(roomName);
		};

		chatSocket.onmessage = function(e) {
			(async () => {
				const data = JSON.parse(e.data);
				let muted = false;
				let amIMuted = false;
				data.timestamp = formatTime(data.timestamp);
				console.log(data);

				if (muteList && muteList.includes(data.user_id)) {
					muted = true;
					console.log('Is sender muted? ', muted);
				}

				if (data.receiver_id) {
					const receiverList = await getMuteListOf(data.receiver_id);
					amIMuted = receiverList.includes(currentUser.user_id);
					console.log('Am i muted by receiver? ', amIMuted);
				}

				if (data.type === 'user_status_update')
					await updateUserStatus(data.user_id, data.is_connected, data.content);
				else if (data.type === 'private_message' && data.receiver_id === data.user_id)
					await trollMessage(data);
				else if (data.type === 'private_message' && (data.receiver_id === currentUser.user_id
					|| data.user_id === currentUser.user_id)) {
					if  (!muted && !amIMuted && data.receiver_id !== data.user_id)
						await privateMessage(data);
					else if (amIMuted && currentUser.user_id === data.user_id)
						await mutedCalls(data);
				}
				else if (data.type === 'invitation_to_play' && (data.receiver_id === currentUser.user_id
					|| data.user_id === currentUser.user_id)) {
					if (!muted && !amIMuted) {
						await joinRoom(`invitation_${data.invitationId}`);
						await invitationToPlay(data);
					} else if (amIMuted && currentUser.user_id === data.user_id) {
						console.log('invitation from muted user');
						await mutedCalls(data);
					}
				}

				else if (data.type === 'invitation_response' && !muted) {
					await leaveRoom(`invitation_${data.invitationId}`);
					if (data.status === 'accepted')
						await connectToGame(data);
					else if (data.status === 'declined')
						await suppressInvitation(data);
				}

				else if (data.type === 'chat_message' && !muted)
					await chatMessage(data);
			})();
		}
	} else
		await joinRoom(roomName);

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
	console.log(chatSocket === null);
	chatSocket = null;
}

async function connectToGame(data) {
	await removePendingInvitationMessage(data.invitationId);
	bindGameSocket(new WebSocket(`wss://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/ws/back`));
	launchFriendGame(data);
}

async function suppressInvitation(data) {
	if (data.receiver_id === currentUser.user_id) {
		await removePendingInvitationMessage(data.invitationId);

		const messageList = document.getElementById('message-content');
		const newMessage = document.createElement('li');``
	
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.username} declined your invitation.`;

		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
}

async function removePendingInvitationMessage(invitationId) {
	const pendingMessageElement = document.getElementById(`pending-invitation-${invitationId}`);
	if (pendingMessageElement) {
		console.log(`Removing pending invitation message with ID: pending-invitation-${invitationId}`);
		pendingMessageElement.remove();
	} else {
		console.log(`No pending invitation message found with ID: pending-invitation-${invitationId}`);
	}
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

export async function trollMessage(data) {
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
		newMessage.textContent = `${content[random]}`;
	} else {
		content = [
			'God bless this poor soul.',
			'Guys, please, just talk to him/her!',
			'Seems like nobody loves him/her.',
			'You know what to do!',
			'Just leave quielty...',
		]
		newMessage.classList.add('chat-message');
		newMessage.textContent = `${data.username} talk to him/herself: ${content[random]}`;
	}
	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function mutedCalls(data) {
	if (data.type === 'invitation_to_play') {
		console.log('Invitation ID : ', data.invitationId);
		await deleteInvitation(data.invitationId);
	}

	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');
 
	newMessage.classList.add('chat-message');
	if (data.type === 'private_message')
		newMessage.textContent = `DM not delivered to : ${data.receiver_username} (reason : muted).`;
	else if (data.type === 'invitation_to_play')
		newMessage.textContent = `Invitation not delivered to : ${data.receiver_username} (reason : muted).`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function deniedInvitation(username) {
	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');
 
	newMessage.classList.add('chat-message');
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

async function invitationToPlay(data) {
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
		const newMessage = document.createElement('div');
		newMessage.classList.add('chat-message');
		newMessage.textContent = `Pending invitation, please wait...`;
		newMessage.id = `pending-invitation-${data.invitationId}`;
	
		messageList.insertBefore(newMessage, messageList.firstChild);
		
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
}

async function handleAccept(data, message) {
	console.log('Accepted invitation with ID: ', data.invitationId);
	message.remove();

	await fetch(`/api/chat/invitations/accepted/${data.invitationId}/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': chatCsrfToken
		},
		body: JSON.stringify({'status': 'accepted'})
		});

	await sendRoomMessage(data, 'accepted');
}

export async function handleDecline(data, message) {
	console.log('Declined invitation with ID: ', data.invitationId);
	message.remove();

	await fetch(`/api/chat/invitations/declined/${data.invitationId}/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': chatCsrfToken
		},
		body: JSON.stringify({'status': 'declined'})
		});

	await sendRoomMessage(data, 'declined');
}

async function deleteInvitation(invitationId) {
	const response = await fetch(`/api/chat/invitations/${invitationId}/`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': chatCsrfToken
		},
	});

	if (response.ok) {
		console.log(`Invitation with ID ${invitationId} deleted successfully.`);
	} else {
		console.error(`Failed to delete invitation with ID ${invitationId}.`);
	}
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
					<input id="chat-input" type="text" placeholder="Type a message...">
					<button id="send-chat-message" class="send-chat-message">Send</button>
				</div>
			</div>
		</div>
	`;

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
			await parseMessage(message);
			messageInputDom.value = '';
		};
	}
}

async function parseMessage(message) {
	console.log('parsing message:', message);

	if (message.startsWith('/')) {
		const parts = message.split(' ');

		if (parts.length >= 2) {
			const cmd = parts[0].slice(1);
			const username = parts[1];

			const response = await fetch('/api/user/get_users/');
			const usersData = await response.json();

			if (cmd === 'dm') {
				let messageContent = parts.slice(2).join(' ');

				for (const user of usersData.users) {
					if (user.username === username) {
						chatSocket.send(JSON.stringify({
							'type': 'private_message',
							'content': convertURL(messageContent),
							'user_id': currentUser.user_id,
							'username': currentUser.username,
							'receiver_id': user.user_id,
							'receiver_username': user.username
						}));
						return ;
					}
				}
			} else if (cmd === 'play') {
				for (const user of usersData.users) {
					if (user.username === username) {
						const checkMute = await getMuteListOf(user.user_id)
						const amIMuted = checkMute.includes(currentUser.user_id)
						if (user.username === currentUser.username) {
							await trollMessage(message);
							return ;
						} else if (!amIMuted) {
							chatSocket.send(JSON.stringify({
								'type': 'invitation_to_play',
								'user_id': currentUser.user_id,
								'username': currentUser.username,
								'receiver_id': user.user_id,
								'receiver_username': user.username
							}));
							return ;
						} else {
							await deniedInvitation(user.username);
							return ;
						}
					}
				}
			}
		}
	} else {
		await sendChatMessage(message);
	}
	return ;
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
	console.log('sending room message');
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

export async function muteUser(userId) {
	muteList.push(Number(userId));
}

export async function unmuteUser(userId) {
	muteList = muteList.filter(id => id !== Number(userId));
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
			console.log(`message from : ${message.user_id}-${message.username} : ${message.content}`);
			console.log(`sender muted : ${muteList.includes(message.user_id)}`);
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
					} else if (muteList.includes(invit.user_id)) {
						console.log('invitation from muted user');
						suppressInvitation(invit);
					}
				}
			}
		});
	} catch (error) {
		console.error('Error loading invitations:', error);
	}
}