import { navigateTo } from './contentLoader.js';
import { chatCsrfToken } from './chat.js';
import { currentUser } from './auth.js';

export async function loadUsers() {
	try {
		const getUsers = await fetch('/api/user/get_users/');
		const usersData = await getUsers.json();

		const muteList = await getMuteListOf(currentUser.user_id);

		const sortedUsers = usersData.users.sort((a, b) => {
		if (a.status === 'online' && b.status !== 'online') return -1;
		if (a.status !== 'online' && b.status === 'online') return 1;
		if (a.status === 'offline' && b.status !== 'offline') return 1;
		if (a.status !== 'offline' && b.status === 'offline') return -1;
			
			return a.username.localeCompare(b.username);
		});

		for (const user of sortedUsers) {
			if (user.user_id !== 1 && user.user_id !== currentUser.user_id)
				addUserToMenu(user.user_id, user.username, user.avatar, user.status, muteList);
		}

	} catch (error) {
		console.error('Error loading users:', error);
	}
}

async function addUserToMenu(user_id, username, avatar, status, muteList) {
	const usersContainer = document.getElementById('users-content');
	let is_muted = false;

	const newUser = document.createElement('li');
	newUser.id = `user-${user_id}`;

	if (muteList && muteList.includes(user_id))
		is_muted = true;

	newUser.innerHTML = `
		<div class="status-indicator ${status === 'offline' ? 'offline' : status === 'online' ? 'online' : 'other'}"></div>
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

		try {
			const response = await fetch(`/api/chat/mute_toggle/${currentUser.user_id}/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': chatCsrfToken
				},
				body: JSON.stringify({target_id: Number(userId)})
			});

			if (!response.ok) {
				throw new Error(`Network response was not ok. Status: ${response.status}`);
			}

			const result = await response.json();

			if (result.muted)
				muteIcon.src = '/assets/images/chat/mute_icon.png';
			else
				muteIcon.src = '/assets/images/chat/chat_icon.png';
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

export async function updateUserStatus(other_id, status) {
	try {
		const response = await fetch('/api/user/get_users/');
		const usersData = await response.json();

		for (const user of usersData.users) {
			const statusElement = document.getElementById(`user-${other_id}`);
			if (user.user_id !== other_id) {
				continue ;
			} else if (statusElement) {
				statusElement.querySelector('.status-indicator').className = `status-indicator ${status === 'offline' ? 'offline' : status === 'online' ? 'online' : 'other'}`;
				sortUpdatedUser(user, statusElement);
			} else if (currentUser.user_id !== other_id) {
				const usersContainer = document.getElementById('users-content');
				if (usersContainer)
					addUserToMenu(user.user_id, user.username, user.avatar, user.status);
			}
		}
	} catch (error) {
		console.error('Error loading users:', error.message);
	}
}

async function sortUpdatedUser(updatedUser, statusElement) {
	const usersContainer = document.getElementById('users-content');

	if (statusElement)
		usersContainer.removeChild(statusElement);

	const currentUsers = Array.from(usersContainer.children).map(child => {
		const userId = Number(child.id.replace('user-', ''));
		const username = child.querySelector('.profile-link p').textContent;
		const statusIndicator = child.querySelector('.status-indicator').classList.contains('online') ? 'online' : child.querySelector('.status-indicator').classList.contains('offline') ? 'offline' : 'other';
		
		return {
			user_id: userId,
			username: username,
			status: statusIndicator,
			element: child
		};
	});

	currentUsers.push({
		user_id: updatedUser.user_id,
		username: updatedUser.username,
		status: updatedUser.status,
		element: statusElement
	});

	const sortedUsers = currentUsers.sort((a, b) => {
		if (a.status === 'online' && b.status !== 'online') return -1;
		if (a.status !== 'online' && b.status === 'online') return 1;
		if (a.status === 'offline' && b.status !== 'offline') return 1;
		if (a.status !== 'offline' && b.status === 'offline') return -1;
		return a.username.localeCompare(b.username);
	});

	usersContainer.innerHTML = '';

	for (const user of sortedUsers) {
		usersContainer.appendChild(user.element);
	}
}

export async function getStatus(user_id) {
	try {
		const response = await fetch('/api/user/get_users/');
		const usersData = await response.json();

		for (const user of usersData.users) {
			if (user.user_id === user_id) {
				return user.status;
			}
		}
		return false;
	} catch (error) {
		console.error('Error loading users:', error.message);
	}
}

export async function getMuteListOf(user_id) {
	try {
		const response = await fetch(`/api/chat/get_mutelist/${user_id}/`);
		if (!response.ok) {
			throw new Error(`Network response was not ok. Status: ${response.status}`);
		}
		const data = await response.json();

		return data.muted_users;
	} catch (error) {
		console.error('Error loading muted users:', error.message);
		return [];
	}
}