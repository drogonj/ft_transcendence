import { currentUser } from './auth.js';
import { csrfToken } from './auth.js';
import { navigateTo } from './contentLoader.js';
import { muteList, muteUser, unmuteUser, formatTime } from './chat.js';

export async function loadUsers() {
	try {
		const getUsers = await fetch('/api/user/get_users/');
		const usersData = await getUsers.json();

		for (const user of usersData.users) {
			if (user.user_id !== 1 && user.user_id !== currentUser.user_id)
				addUserToMenu(user.user_id, user.username, user.avatar, user.is_connected);
		}
	} catch (error) {
		console.error('Error loading users:', error);
	}
}

async function addUserToMenu(user_id, username, avatar, is_connected) {
	const usersContainer = document.getElementById('users-content');
	let is_muted = false;

	const newUser = document.createElement('li');
	newUser.id = `user-${user_id}`;

	if (muteList && muteList.includes(user_id)) {
		is_muted = true;
	}

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

			if (isMuted) {
				muteButton.classList.remove('muted');
				unmuteUser(userId);
				muteIcon.src = '/assets/images/chat/chat_icon.png';
			} else {
				muteButton.classList.add('muted');
				muteUser(userId);;
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

export async function updateUserStatus(other_id, isConnected, timestamp, content) {
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
				await sendUpdateStatusToChat(timestamp, content);
			} else if (currentUser.user_id !== other_id) {
				const usersContainer = document.getElementById('users-content');
				if (usersContainer) {
					addUserToMenu(user.user_id, user.username, user.avatar, user.is_connected);
					await sendUpdateStatusToChat(timestamp, content);
				}
			}
		} 
	} catch (error) {
		console.error('Error loading users:', error.message);
	}
}

export async function sendUpdateStatusToChat(timestamp, content) {
	const messageList = document.getElementById('message-content');
	const newMessage = document.createElement('li');

	newMessage.classList.add('chat-message');
	newMessage.textContent = `${timestamp} : ${content}`;

	messageList.insertBefore(newMessage, messageList.firstChild);
	
	const chatMessages = document.getElementById('chat-messages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

export async function getUserStatus(user_id) {
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

export async function getMuteListOf(user_id) {
	try {
		const response = await fetch(`api/user/get_mutelist/${user_id}/`);
		const data = await response.json();

		return data.muted_users;
	} catch (error) {
		console.error('Error loading muted users:', error.message);
	}
}