import { navigateTo, app } from './contentLoader.js';
import { currentUser } from './auth.js';
import { csrfToken } from './auth.js';

let chatSocket = null;
let chatSocketRunning = false;
let mutedUserIds = [];

// Quelques points verifier:
// Attention a la prise en compte de ADMIN et de son ID dans le chat et les rooms (choix de config)
// Deplacer les GetAllUsersDataView(View) dans Authentication et modifier les routes (urls.py) (optionnel)
// Check la configuration CACHE/DATABASE dans settings.py et du coup la sauvegarde des messages
// ==> REDIS:6379/1 pour le cache (voir si besoin d'une adresse 0 et/ou definir si juste redis:6379 pour DB)
// Commencer la partie muted users (voir si on mute les messages ou les users)

export async function connectChatWebsocket(user_id) {
	if (chatSocket) {
		return;
	}

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
			console.log(currentUser.user_id);	

			if (data.type === 'chat_message') {
				const messageList = document.getElementById('message-content');
				const newMessage = document.createElement('li');
	
				newMessage.classList.add('chat-message');
				newMessage.textContent = `${data.timestamp} ${data.username} : ${data.content}`;
	
				messageList.insertBefore(newMessage, messageList.firstChild);
				
				const chatMessages = document.getElementById('chat-messages');
				chatMessages.scrollTop = chatMessages.scrollHeight;
			} else if (data.type === 'private_message') {
				const messageList = document.getElementById('message-content');
				const newMessage = document.createElement('li');
	
				const receiverStatus = await getUserStatus(data.receiver_id);
				console.log(receiverStatus);
	
				if (data.receiver_id === currentUser.user_id && receiverStatus) {
					newMessage.classList.add('chat-message');
					newMessage.textContent = `${data.timestamp} ${data.username} sent you privately: ${data.content}`;
	
					messageList.insertBefore(newMessage, messageList.firstChild);
					
					const chatMessages = document.getElementById('chat-messages');
					chatMessages.scrollTop = chatMessages.scrollHeight;
				} else if (!receiverStatus && data.user_id === currentUser.user_id) {
					console.log('User is offline, message not sent.');
					newMessage.classList.add('chat-message');
					newMessage.textContent = `${data.timestamp} DM not delivered to : ${data.receiver_username} (reason : offline).`;
	
					messageList.insertBefore(newMessage, messageList.firstChild);
					
					const chatMessages = document.getElementById('chat-messages');
					chatMessages.scrollTop = chatMessages.scrollHeight;
				}
			} else if (data.type === 'user_status_update') {
				updateUserStatus(data.user_id, data.is_connected, data.timestamp, data.content);
			}
		})();
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

export async function loadUsers() {
	try {
		const response = await fetch('/api/user/get_users/');
		const usersData = await response.json();

		for (const user of usersData.users) {
			if (user.user_id !== 1 && user.user_id !== currentUser.user_id) {
				const response2 = await fetch(`api/user/is_muted/${currentUser.user_id}/${user.user_id}/`);
				const muteList = await response2.json();
				addUserToMenu(user.user_id, user.username, user.avatar, user.is_connected, muteList.is_muted);
			}
		}

	} catch (error) {
		console.error('Error loading users:', error);
	}
}

async function addUserToMenu(user_id, username, avatar, is_connected, is_muted) {
	const usersContainer = document.getElementById('users-content');

	const newUser = document.createElement('li');
	newUser.id = `user-${user_id}`;

	newUser.innerHTML = `
		<div class="status-indicator ${is_connected ? 'online' : 'offline'}"></div>
		<div class="avatar-container">
			<img class="avatar" src="${avatar}" alt="${username}'s Avatar">
		</div>
		<span class="profile-link" data-user-id="${user_id}">
			<p>${username}</p>
		</span>
        <button class="mute-user-button ${is_muted ? 'muted' : ''}" data-user-id="${user_id}">
            <img src="/assets/images/chat/${is_muted ? 'mute_icon.png' : 'chat_icon.png'}" alt="mute">
        </button>
	`;

	usersContainer.insertAdjacentElement('beforeend', newUser);

	// newUser.querySelector('.mute-user-button').addEventListener('click', async (event) => {
	// 	const userId = event.currentTarget.getAttribute('data-user-id');
	// 	const userElement = document.getElementById(`user-${userId}`);

	// 	if (!userElement) {
	// 		console.error(`User element with ID user-${userId} not found.`);
	// 		return;
	// 	}

	// 	const muteButton = userElement.querySelector('.mute-user-button');
	// 	const muteIcon = muteButton.querySelector('img');

	// 	if (muteButton.classList.contains('muted')) {
	// 		muteButton.classList.remove('muted');
	// 		mutedUserIds = mutedUserIds.filter(id => id !== userId);
	// 		muteIcon.src = '/assets/images/chat/chat_icon.png';
	// 	} else {
	// 		muteButton.classList.add('muted');
	// 		mutedUserIds.push(userId);
	// 		muteIcon.src = '/assets/images/chat/mute_icon.png';
	// 	}
	// });

	newUser.querySelector('.mute-user-button').addEventListener('click', async (event) => {
		const userId = event.currentTarget.getAttribute('data-user-id');
		const userElement = document.getElementById(`user-${userId}`);
	
		if (!userElement) {
			console.error(`User element with ID user-${userId} not found.`);
			return;
		}
	
		const muteButton = userElement.querySelector('.mute-user-button');
		const muteIcon = muteButton.querySelector('img');
	
		const isMuted = muteButton.classList.contains('muted');
	
		try {
			const response = await fetch(`/api/user/mute_toggle/${userId}/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken
				},
				body: JSON.stringify({ muted: !isMuted })
			});
	
			if (!response.ok) {
				throw new Error(`Network response was not ok. Status: ${response.status}`);
			}
	
			const responseData = await response.json();
			console.log('Response data:', responseData);

			if (isMuted) {
				muteButton.classList.remove('muted');
				mutedUserIds = mutedUserIds.filter(id => id !== userId);
				muteIcon.src = '/assets/images/chat/chat_icon.png';
			} else {
				muteButton.classList.add('muted');
				mutedUserIds.push(userId);
				muteIcon.src = '/assets/images/chat/mute_icon.png';
			}
		} catch (error) {
			console.error('Error updating mute state:', error);
		}
	});
	

	newUser.querySelector('.profile-link').addEventListener('click', async function (event) {
		 const userId = this.getAttribute('data-user-id');
		 const uri = '/profile/' + userId + '/';
		 navigateTo(uri, true);
	});
}

export async function renderChatApp() {
	await connectChatWebsocket(currentUser.user_id);
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
	if (!message.startsWith('/')) {
		chatSocket.send(JSON.stringify({
			'type': 'chat_message',
			'content': message,
			'user_id': currentUser.user_id,
			'username': currentUser.username
		}));
	} else if (message.startsWith('/')) {
		const parts = message.split(' ');
		if (parts.length < 2) {
			chatSocket.send(JSON.stringify({
				'type': 'chat_message',
				'content': message,
				'user_id': currentUser.user_id,
				'username': currentUser.username
			}));
		} else { 
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
			} else {
			chatSocket.send(JSON.stringify({
				'type': 'chat_message',
				'content': message,
				'user_id': currentUser.user_id,
				'username': currentUser.username
				}));
			};
		};
	}
	return ;
}

async function updateUserStatus(other_id, isConnected, timestamp, content) {
	console.log('Updating user status:', other_id, isConnected);
	try {
		const response = await fetch('/api/user/get_users/');
		const usersData = await response.json();

		for (const user of usersData.users) {
			const statusElement = document.getElementById(`user-${other_id}`);
			if (user.user_id !== other_id) {
				continue ;
			} else if (statusElement) {
				statusElement.querySelector('.status-indicator').className = `status-indicator ${isConnected ? 'online' : 'offline'}`;
				console.log(`Updated status for user ${other_id} to ${isConnected ? "Online" : "Offline"}`);
			} else if (currentUser.user_id !== other_id) {
				const usersContainer = document.getElementById('users-content');
				if (usersContainer) {
					addUserToMenu(user.user_id, user.username, user.avatar, user.is_connected);
				}
			}
			
			const messageList = document.getElementById('message-content');
			const newMessage = document.createElement('li');

			newMessage.classList.add('chat-message');
			newMessage.textContent = `${timestamp} : ${content}`;

			messageList.insertBefore(newMessage, messageList.firstChild);
			
			const chatMessages = document.getElementById('chat-messages');
			chatMessages.scrollTop = chatMessages.scrollHeight;
			break ;
		} 
	} catch (error) {
		console.error('Error loading users:', error.message);
	}
}

async function getUserStatus(user_id) {
	try {
		const response = await fetch('/api/user/get_users/');
		const usersData = await response.json();

		for (const user of usersData.users) {
			if (user.user_id === user_id) {
				return user.is_connected;
			}
		}
		return false;
	} catch (error) {
		console.error('Error loading users:', error.message);
	}
}
