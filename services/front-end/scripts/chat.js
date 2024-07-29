let chatSocket = null;
let chatSocketRunning = false;

export async function connectChatWebsocket() {
	const roomName = 'general';
	const chatSocket = new WebSocket('wss://localhost:8080/ws/chat/' + roomName + '/');

	chatSocket.onopen = function(e) {
		chatSocketRunning = true;
		console.log("Chat WebSocket connection established.");
	};

	chatSocket.onmessage = function(e) {
		const data = JSON.parse(e.data);
		const chatMessages = document.getElementById('chat-messages');
		const newMessage = document.createElement('div');

		newMessage.classList.add('chat-message');
		newMessage.textContent = data.message;
		chatMessages.appendChild(newMessage);
		chatMessages.scrollTop = chatMessages.scrollHeight;
	};

	chatSocket.onclose = function(e) {
		console.error('Chat socket closed unexpectedly');
	};

	chatSocket.onerror = function(error) {
		console.error(`[error] ${error.message}`);
	};
}

export async function loadUsers() {
	try {
		const response = await fetch('/api/chat/get_users/');
		const usersData = await response.json();

		console.log(usersData);
		for (const user of usersData.users) {
			if (user.is_connected === false && user.id === 1) {
				continue;
			}
			else
				addUserToMenu(user.username, user.id, user.avatar, user.is_connected);
		}

	} catch (error) {
		console.error('Error loading users:', error);
	}
}

export function addUserToMenu(user, username, avatar, is_connected) {
	const usersContainer = document.getElementById('users-content');

	const newUser = document.createElement('li');
	newUser.id = `user-${user}`;

	newUser.innerHTML = `
		<div class="status-indicator ${is_connected ? 'online' : 'offline'}"></div>
		<div class="avatar-container">
			<img class="avatar" src="${avatar}" alt="${user}'s Avatar">
		</div>
		<span class="profile-link" data-user-id="${user}">
			<p>${user}</p>
		</span>
		<button class="mute-user-button" data-user-id="${user}">
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

export async function renderChatApp(user_id) {
	console.log("test user id : " + user_id);
	const app = document.getElementById('app');
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
		}));
		messageInputDom.value = '';
	};
}