import { getCsrfToken, csrfToken } from "./auth.js";
import { navigateTo } from "./contentLoader.js";
import { neil } from "./render.js";

export let friendSocket = null;

export async function connectFriendsWebsocket() {
    if (friendSocket !== null)
        return;

    const tokenRequest = await fetch('/api/user/ws_token/');
    const token = await tokenRequest.json();

    friendSocket = new WebSocket(`wss://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/ws/friend-requests/?uuid=${token.uuid}`);

    friendSocket.onopen = function(e) {
        console.log("WebSocket connection established.");
    };

    friendSocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        const type = data.type

        const user_id = data.id;
        const from_user = data.username;

        const route =  window.location.pathname + window.location.search;
        ifif: if (type === 'friend_request_notification') {
            addFriendshipRequestToMenu(user_id, from_user, data.avatar)
            neil();
        } else if (type === 'accepted_friendship_request_notification') {
            addFriendToMenu(user_id, from_user, data.avatar, data.status)
        } else if (type === 'canceled_friendship_notification') {
            const divId = "friend-" + user_id;
            const element = document.getElementById(divId);
            if (!element)
                break ifif;
            element.remove();
        } else if (type === 'friend_connected_notification') {
            changeFriendStatus(user_id, 'online');
        } else if (type === 'friend_disconnected_notification') {
            changeFriendStatus(user_id, 'offline')
        } else if (type === 'friend_ingame_notification') {
            changeFriendStatus(user_id, 'in-game')
        } else if (type === 'friend_matchmaking_notification') {
            changeFriendStatus(user_id, 'matchmaking')
        } else if (type === 'friend_tournament_notification') {
            changeFriendStatus(user_id, 'tournament')
        }
    };

    friendSocket.onclose = function(event) {
        if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            console.log('[close] Connection died');
        }
        friendSocket = null;
    };

    friendSocket.onerror = function(error) {
        console.error(`[error] ${error.message}`);
    };
}

export async function disconnectFriendsWebsocket() {
    friendSocket.close();
    friendSocket = null;
}

export function changeFriendStatus(userId, status) {
    let friendElement = document.getElementById(`friend-${userId}`);

    if (!friendElement)
        return;

    if (friendElement) {
        const statusIndicator = friendElement.querySelector('.status-indicator');
        const statusIndicatorText = friendElement.querySelector('.status-indicator-text');
        const ul = friendElement.parentElement;

        if (statusIndicator) {
            statusIndicator.classList.remove('offline', 'online', 'other');
            let newClass = (status === 'offline') ? 'offline' : (status === 'online') ? 'online' : 'other';
            statusIndicator.classList.add(newClass)
        }

        if (statusIndicatorText) {
            statusIndicatorText.textContent = status;
        }

        if (status !== 'offline') {
            ul.prepend(friendElement)
        } else {
            ul.appendChild(friendElement)
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
        addFriendToMenu(data.id, username, data.avatar, data.status);
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
        await addFriendToMenu(friendId, responseData.username, friendAvatar, responseData.status)
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

// Function to add a friend to the menu
export function addFriendToMenu(user, username, avatar, status) {
    const friendsContainer = document.getElementById('friends-content');

    if (!friendsContainer)
        return;

    // Create a new li element for the friend
    const newFriend = document.createElement('li');
    newFriend.id = `friend-${user}`;

    // HTML structure of the friend
    newFriend.innerHTML = `
        <div class="status-indicator offline"></div>
        <p class="status-indicator-text">offline</p>
        <div class="avatar-container">
            <img class="avatar" src="${avatar}" alt="${username}'s Avatar">
        </div>
        <span class="profile-link" data-user-id="${user}">
            <p>${username}</p>
        </span>
        <button class="delete-friend-button" data-friend-id="${user}">
            <img src="/assets/images/friends/red_cross.png" alt="delete">
        </button>
    `;

    const divId = "friendship-request-" + user;
    if (document.getElementById(divId))
        document.getElementById(divId).remove();

    // Add the new element to the existing list
    friendsContainer.insertAdjacentElement('beforeend', newFriend);

    changeFriendStatus(user, status);

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
}

// Function to load friends
export async function loadFriends() {
    try {
        const friendsResponse = await fetch('/api/user/get_friends/');
        const friendsData = await friendsResponse.json();

        // Use for...of loop to iterate over friends and await each addFriendToMenu call
        for (const friend of friendsData.friends) {
            addFriendToMenu(friend.id, friend.username, friend.avatar, friend.status);
        }

    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

// Function to add a friendship request to the menu
export function addFriendshipRequestToMenu(user, username, avatar) {
    const friendshipRequestsContainer = document.getElementById('requests-content');

    if (!friendshipRequestsContainer)
        return;

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
            <img src="/assets/images/friends/green_check.png" alt="accept">
        </button>
        <button class="decline-friendship-request-button" data-friend-id="${user}">
            <img src="/assets/images/friends/red_cross.png" alt="cancel">
        </button>
    `;

    // Add the new element to the existing list
    friendshipRequestsContainer.insertAdjacentElement('beforeend', newFriendshipRequest);

    // Add event listeners for the new buttons
    newFriendshipRequest.querySelector('.accept-friendship-request-button').addEventListener('click', async (event) => {
        await acceptFriendshipRequest(event);
        await neil();
    });
    newFriendshipRequest.querySelector('.decline-friendship-request-button').addEventListener('click', async (event) => {
        await declineFriendshipRequest(event);
        await neil();
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
                    <img src="/assets/images/friends/green_cross.png" alt="add">
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
                        <img id="invitation-sent-img" src="/assets/images/friends/invitation_sent.png" alt="invitation-sent">
                        `;
                    userField.addEventListener('click', function() {
                        const userId = userField.getAttribute('data-user-id');
                        const uri = '/profile/' + user.id+ '/';
                        navigateTo(uri, true);
                    });
                });
            } else {
                userField.innerHTML += `
                <img id="invitation-sent-img" src="/assets/images/friends/invitation_sent.png" alt="invitation-sent">
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