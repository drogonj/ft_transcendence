import { getCsrfToken, csrfToken } from "./auth.js";
import { navigateTo } from "./contentLoader.js";
import { openChatWindow } from "./chat.js";

let friendSocket;
let friendSocketRunning = false;

export async function connectFriendsWebsocket() {
    friendSocket = new WebSocket('wss://localhost:8080/ws/friend-requests/');

    friendSocket.onopen = function(e) {
        friendSocketRunning = true;
        console.log("WebSocket connection established.");
    };

    friendSocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        const type = data.type
        console.log(data)

        const user_id = data.id;
        const from_user = data.username;

        const route =  window.location.pathname + window.location.search;
        if (route === '/home' || route === '/home/') {
            if (type === 'friend_request_notification') {
                const avatar = data.avatar
                addFriendshipRequestToMenu(user_id, from_user, avatar)
            } else if (type === 'accepted_friendship_request_notification') {
                const avatar = data.avatar
                const is_connected = data.is_connected
                addFriendToMenu(user_id, from_user, avatar, is_connected)
            } else if (type === 'canceled_friendship_notification') {
                const divId = "friend-" + user_id;
                const element = document.getElementById(divId);
                element.remove();
            } else if (type === 'friend_connected_notification') {
                changeFriendStatus(user_id, true);
            } else if (type === 'friend_disconnected_notification') {
                changeFriendStatus(user_id, false)
            }
        }
    };

    friendSocket.onclose = function(event) {
        friendSocketRunning = false;
        if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            console.log('[close] Connection died');
        }
    };

    friendSocket.onerror = function(error) {
        console.error(`[error] ${error.message}`);
    };
}

export async function disconnectFriendsWebsocket() {
    friendSocket.close();
}

export function changeFriendStatus(userId, is_connected) {
    let friendElement = document.getElementById(`friend-${userId}`);
    if (friendElement) {
        const statusIndicator = friendElement.querySelector('.status-indicator');
        const statusIndicatorText = friendElement.querySelector('.status-indicator-text');

        if (statusIndicator) {
            statusIndicator.classList.remove('offline', 'online');
            statusIndicator.classList.add(is_connected ? 'online' : 'offline');
        }

        if (statusIndicatorText) {
            statusIndicatorText.textContent = is_connected ? 'online' : 'offline';
        }
    }
}

export async function addFriend(event) {
    event.preventDefault();

    const button = event.currentTarget;
    const userId = button.getAttribute('data-user-id');
    const username = button.getAttribute('data-user-username');

    await getCsrfToken();

    const response = await fetch('/api/user/add_friend/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ id: userId })
    });
    const data = await response.json();
    if (data.error) {
        alert(data.error);
    } else if (data.message && data.message === 'friendship request accepted') {
        addFriendToMenu(data.id, username, data.avatar, data.is_connected);
    }
}

export async function removeFriend(event) {
    const button = event.currentTarget;
    const friendId = button.dataset.friendId;

    await getCsrfToken();

    const response = await fetch('/api/user/remove_friend/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ friend_id: friendId })
    });

    const responseData = await response.json();
    if (response.ok) {
        const divId = "friend-" + friendId;
        const element = document.getElementById(divId);
        element.remove();
    }
}

export async function acceptFriendshipRequest(event) {
    const button = event.currentTarget;
    const friendId = button.dataset.friendId;
    const friendAvatar = button.dataset.friendAvatar;

    await getCsrfToken();

    const response = await fetch('/api/user/accept_friendship_request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ id: friendId })
    });

    const responseData = await response.json();
    if (response.ok) {
        const divId = "friendship-request-" + friendId
        const element = document.getElementById(divId);
        element.remove();
        console.log(responseData)
        await addFriendToMenu(friendId, responseData.username, friendAvatar, responseData.is_connected)
    }
}

export async function declineFriendshipRequest(event) {
    const button = event.currentTarget;
    const friendId = button.dataset.friendId;

    await getCsrfToken();

    const response = await fetch('/api/user/decline_friendship_request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({id: friendId})
    });

    const responseData = await response.json();
    if (response.ok) {
        const divId = "friendship-request-" + friendId;
        const element = document.getElementById(divId);
        element.remove();
    }
}

document.body.insertAdjacentHTML('beforeend', `
    <div id="chat-modal" class="chat-modal">
        <div class="chat-modal-content">
            <span class="close-chat">&times;</span>
            <div id="chat-window">
                <!-- Chat content will go here -->
            </div>
        </div>
    </div>
`);

// Function to add a friend to the menu
export function addFriendToMenu(user, username, avatar, is_connected) {
    const friendsContainer = document.getElementById('friends-content');

    // Create a new li element for the friend
    const newFriend = document.createElement('li');
    newFriend.id = `friend-${user}`;

    // HTML structure of the friend
    newFriend.innerHTML = `
        <div class="status-indicator ${is_connected ? 'online' : 'offline'}"></div>
        <p class="status-indicator-text">${is_connected ? 'online' : 'offline'}</p>
        <div class="avatar-container">
            <img class="avatar" src="${avatar}" alt="${username}'s Avatar">
        </div>
        <span class="profile-link" data-user-id="${user}">
            <p>${username}</p>
        </span>
		<button class="chat-friend-button" data-friend-id="${user}">
            <img src="../assets/images/friends/chat_icon.png" alt="chat">
        </button>
        <button class="delete-friend-button" data-friend-id="${user}">
            <img src="../assets/images/friends/red_cross.png" alt="delete">
        </button>
    `;

    const divId = "friendship-request-" + user;
    if (document.getElementById(divId))
        document.getElementById(divId).remove();

    // Add the new element to the existing list
    friendsContainer.insertAdjacentElement('beforeend', newFriend);

    changeFriendStatus(user, is_connected);

    // Add event listener for the delete button
    newFriend.querySelector('.delete-friend-button').addEventListener('click', async (event) => {
        await removeFriend(event);
    });

    // Profile link
    newFriend.querySelector('.profile-link').addEventListener('click', async function (event) {
        const userId = this.getAttribute('data-user-id');
        const uri = '/profile/' + userId + '/';
        navigateTo(uri, true);
    });

	// Chat button
	newFriend.querySelector('.chat-friend-button').addEventListener('click', async (event) => {
		const friendId = event.currentTarget.dataset.friendId;
		const friendName = event.currentTarget.parentElement.querySelector('.profile-link').textContent;
		openChatWindow(friendId, friendName);
	});

}

// Function to load friends
export async function loadFriends() {
    try {
        const friendsResponse = await fetch('/api/user/get_friends/');
        const friendsData = await friendsResponse.json();

        // Use for...of loop to iterate over friends and await each addFriendToMenu call
        for (const friend of friendsData.friends) {
            addFriendToMenu(friend.id, friend.username, friend.avatar, friend.is_connected);
        }

    } catch (error) {
        console.error('Error loading friends:', error);
    }
}
// Function to add a friendship request to the menu
export function addFriendshipRequestToMenu(user, username, avatar) {
    const friendshipRequestsContainer = document.getElementById('requests-content');

    // Create a new li element for the new friendship request
    const newFriendshipRequest = document.createElement('li');
    newFriendshipRequest.id = `friendship-request-${user}`;

    // HTML structure of the friendship request
    newFriendshipRequest.innerHTML = `
        <div class="avatar-container">
            <img class="avatar" src="${avatar}" alt="${username}'s Avatar">
        </div>
        <span class="profile-link" data-user-id="${user}">
            <p>${username}</p>
        </span>
        <button class="accept-friendship-request-button" data-friend-id="${user}" data-friend-avatar="${avatar}">
            <img src="../assets/images/friends/green_check.png" alt="accept">
        </button>
        <button class="decline-friendship-request-button" data-friend-id="${user}">
            <img src="../assets/images/friends/red_cross.png" alt="cancel">
        </button>
    `;

    // Add the new element to the existing list
    friendshipRequestsContainer.insertAdjacentElement('beforeend', newFriendshipRequest);

    // Add event listeners for the new buttons
    newFriendshipRequest.querySelector('.accept-friendship-request-button').addEventListener('click', async (event) => {
        await acceptFriendshipRequest(event);
    });
    newFriendshipRequest.querySelector('.decline-friendship-request-button').addEventListener('click', async (event) => {
        await declineFriendshipRequest(event);
    });
    // Profile link
    newFriendshipRequest.querySelector('.profile-link').addEventListener('click', async function (event) {
        const userId = this.getAttribute('data-user-id');
        const uri = '/profile/' + userId + '/';
        navigateTo(uri, true);
    });
}

// Function to load friendship requests
export async function loadFriendshipRequests() {
    try {
        const friendshipRequestsResponse = await fetch('/api/user/get_received_friendship_requests/');
        const friendshipRequestsData = await friendshipRequestsResponse.json();

        // Use for...of loop to iterate over requests and await each addFriendshipRequestToMenu call
        for (const request of friendshipRequestsData.requests) {
            await addFriendshipRequestToMenu(request.id, request.username, request.avatar);
        }
    } catch (error) {
        console.error('Error loading friendship requests:', error);
    }
}

export async function handleUserSearch(event) {
    event.preventDefault();
    const query = document.getElementById('search-query').value;
    const response = await fetch(`/api/user/search/?q=${query}`);
    const data = await response.json();
    const resultsContainer = document.getElementById('search-results');

    resultsContainer.innerHTML = "";

    if (data.users.length > 0) {
        data.users.forEach(user => {
            const userField = document.createElement('li');
            userField.id = 'user-' + user.id;

            userField.innerHTML = `
                <div class="avatar-container">
                    <img class="avatar" src="${user.avatar}" alt="${user.username}'s Avatar">
                </div>
                <span class="profile-link" data-user-id="${user.id}">
                    <p>${user.username}</p>
                </span>
            `;

            if (user.pending_request === false) {
                userField.innerHTML += `
                <button class="add-friend-button" data-user-username="${user.username}" data-user-id="${user.id}">
                    <img src="../assets/images/friends/green_cross.png" alt="add">
                </button>
                `;
                userField.querySelector('.add-friend-button').addEventListener('click', async (event) => {
                    await addFriend(event);
                    userField.innerHTML = `
                        <div class="avatar-container">
                            <img class="avatar" src="${user.avatar}" alt="${user.username}'s Avatar">
                        </div>
                        <span class="profile-link" data-user-id="${user.id}">
                            <p>${user.username}</p>
                        </span>
                        <img id="invitation-sent-img" src="../assets/images/friends/invitation_sent.png" alt="invitation-sent">
                        `;
                });
            } else {
                userField.innerHTML += `
                <img id="invitation-sent-img" src="../assets/images/friends/invitation_sent.png" alt="invitation-sent">
                `;
            }

            resultsContainer.insertAdjacentElement('beforeend', userField);
        });
        // Profile link
        document.querySelectorAll('.profile-link').forEach(element => {
            element.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const uri = '/profile/' + userId + '/';
                navigateTo(uri, true);
            });
        });
    } else {
        resultsContainer.innerHTML += '<p>No users found.</p>';
    }
}
