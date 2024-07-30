let chatSocket = null;
let chatSocketRunning = false;
let userSocket = null;
let userSocketRunning = false;

import { navigateTo, app } from './contentLoader.js';

// export async function connectUserWebsocket() {
// 	userSocket = new WebSocket('wss://localhost:8080/ws/chat/users/');

// 	userSocket.onopen = function(e) {
// 		chatSocketRunning = true;
// 		console.log("User connection established.");
// 	};

// 	userSocket.onmessage = function(e) {
// 		const data = JSON.parse(e.data);
// 		const type = data.type;
// 		console.log(data);

// 		const usersContainer = document.getElementById('users-content');
// 		const user = document.getElementById(`user-${data.user_id}`);

// 		const route =  window.location.pathname + window.location.search;
//         if (route === '/home' || route === '/home/') {
//             if (type === 'friend_request_notification') {
//                 const avatar = data.avatar
//                 addFriendshipRequestToMenu(user_id, from_user, avatar)
//             } else if (type === 'accepted_friendship_request_notification') {
//                 const avatar = data.avatar
//                 const is_connected = data.is_connected
//                 addFriendToMenu(user_id, from_user, avatar, is_connected)
//             } else if (type === 'canceled_friendship_notification') {
//                 const divId = "friend-" + user_id;
//                 const element = document.getElementById(divId);
//                 element.remove();
//             } else if (type === 'friend_connected_notification') {
//                 changeFriendStatus(user_id, true);
//             } else if (type === 'friend_disconnected_notification') {
//                 changeFriendStatus(user_id, false)
//             }
// 		}

// 		newMessage.classList.add('chat-message');
// 		newMessage.textContent = data.message;
// 		chatMessages.appendChild(newMessage);
// 		chatMessages.scrollTop = chatMessages.scrollHeight;
// 	};

// 	userSocket.onclose = function(e) {
// 		chatSocketRunning = false;
// 		if (e.wasClean) {
// 			console.log(`[close] User Connection closed cleanly, code=${e.code} reason=${e.reason}`);
// 		} else {
// 			console.log('[close] User Connection died');
// 		}
// 	};

// 	userSocket.onerror = function(error) {
// 		console.error(`[error] ${error.message}`);
// 	};
// }

export async function connectChatWebsocket() {
	const roomName = 'general';
	chatSocket = new WebSocket('wss://localhost:8080/ws/chat/' + roomName + '/');

	chatSocket.onopen = function(e) {
		chatSocketRunning = true;
		console.log("Chat WebSocket connection established.");
	};

	chatSocket.onmessage = function(e) {
		const data = JSON.parse(e.data);
		console.log(data);
		const chatMessages = document.getElementById('chat-messages');
		const newMessage = document.createElement('div');

		newMessage.classList.add('chat-message');
		newMessage.textContent = data.message;
		chatMessages.appendChild(newMessage);
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
	// const app = document.getElementById('app');
	app.innerHTML += `
		<div id="users-list" class="users-list">
		<div class="users-title">Users</div>
			<ul id="users-content" class="users-content active"></ul>
		</div>
		<div id="chat-menu" class="chat-menu">
			<div id="chat-messages" class="chat-messages"></div>
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