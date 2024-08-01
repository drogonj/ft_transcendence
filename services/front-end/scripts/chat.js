let chatSocket = null;
let chatSocketRunning = false;

import { navigateTo, app } from './contentLoader.js';

export async function connectChatWebsocket() {
	if (chatSocket) {
		return;
	}

	const roomName = 'general';
	chatSocket = new WebSocket(`wss://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/ws/chat/` + roomName + '/');

	chatSocket.onopen = function(e) {
		chatSocketRunning = true;
		console.log("Chat WebSocket connection established.");
	};

	chatSocket.onmessage = function(e) {
		const data = JSON.parse(e.data);
		console.log(data);
		const messageList = document.getElementById('message-content');
		const newMessage = document.createElement('li');

		newMessage.classList.add('chat-message');
		newMessage.textContent = data.timestamp + " - " + data.username + ": " + data.message;
		messageList.insertBefore(newMessage, messageList.firstChild);
		const chatMessages = document.getElementById('chat-messages');
		chatMessages.scrollTop = chatMessages.scrollHeight;
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

		console.log(usersData);
		for (const user of usersData.users) {
			console.log(selfId, user.id);
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

	//changeUserStatus(user, is_connected);

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