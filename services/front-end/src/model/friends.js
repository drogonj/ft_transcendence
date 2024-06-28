import { getCsrfToken, csrfToken } from "./auth.js";

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

    const username = document.getElementById('target-username').value;

    await getCsrfToken();

    const response = await fetch('/api/user/add_friend/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ username: username })
    });
    const data = await response.json();
    if (data.error) {
        alert(data.error);
    }
}

export async function removeFriend(event) {
    const button = event.currentTarget;
    const friendUsername = button.dataset.friendUsername;

    await getCsrfToken();

    const response = await fetch('/api/user/remove_friend/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ friend_username: friendUsername })
    });

    const responseData = await response.json();
    if (response.ok) {
        const divId = "friend-" + friendUsername
        const element = document.getElementById(divId);
        element.remove();
    }
}

export async function acceptFriendshipRequest(event) {
    const button = event.currentTarget;
    const friendUsername = button.dataset.friendUsername;
    const friendAvatar = button.dataset.friendAvatar;

    await getCsrfToken();

    const response = await fetch('/api/user/accept_friendship_request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ username: friendUsername })
    });

    const responseData = await response.json();
    if (response.ok) {
        const divId = "friendship-request-" + friendUsername
        const element = document.getElementById(divId);
        element.remove();
        console.log(responseData)
        await addFriendToMenu(friendUsername, friendAvatar, responseData.is_connected)
    }
}

export async function declineFriendshipRequest(event) {
    const button = event.currentTarget;
    const friendUsername = button.dataset.friendUsername;

    await getCsrfToken();

    const response = await fetch('/api/user/decline_friendship_request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({username: friendUsername})
    });

    const responseData = await response.json();
    if (response.ok) {
        const divId = "friendship-request-" + friendUsername
        const element = document.getElementById(divId);
        element.remove();
    }
}

// Function to add a friend to the menu
export function addFriendToMenu(user, avatar, is_connected) {
    const friendsContainer = document.getElementById('friends-content');

    // Create a new li element for the friend
    const newFriend = document.createElement('li');
    newFriend.id = `friend-${user}`;

    // HTML structure of the friend
    newFriend.innerHTML = `
        <div class="status-indicator ${is_connected ? 'online' : 'offline'}"></div>
        <p class="status-indicator-text">${is_connected ? 'online' : 'offline'}</p>
        <div class="avatar-container">
            <img class="avatar" src="${avatar}" alt="${user}'s Avatar">
        </div>
        <p>${user}</p>
        <button class="delete-friend-button" data-friend-username="${user}">
            <img src="/src/images/red_cross.png" alt="delete">
        </button>
    `;

    // Add the new element to the existing list
    friendsContainer.insertAdjacentElement('beforeend', newFriend);

    changeFriendStatus(user, is_connected);

    // Add event listener for the delete button
    newFriend.querySelector('.delete-friend-button').addEventListener('click', async (event) => {
        await removeFriend(event);
    });
}

// Function to load friends
export async function loadFriends() {
    try {
        const friendsResponse = await fetch('/api/user/get_friends/');
        const friendsData = await friendsResponse.json();

        // Use for...of loop to iterate over friends and await each addFriendToMenu call
        for (const friend of friendsData.friends) {
            addFriendToMenu(friend.username, friend.avatar, friend.is_connected);
        }

    } catch (error) {
        console.error('Error loading friends:', error);
    }
}
// Function to add a friendship request to the menu
export function addFriendshipRequestToMenu(user, avatar) {
    const friendshipRequestsContainer = document.getElementById('requests-content');

    // Create a new li element for the new friendship request
    const newFriendshipRequest = document.createElement('li');
    newFriendshipRequest.id = `friendship-request-${user}`;

    // HTML structure of the friendship request
    newFriendshipRequest.innerHTML = `
        <div class="avatar-container">
            <img class="avatar" src="${avatar}" alt="${user}'s Avatar">
        </div>
        <p>${user}</p>
        <button class="accept-friendship-request-button" data-friend-username="${user}" data-friend-avatar="${avatar}">
            <img src="/src/images/green_check.png" alt="accept">
        </button>
        <button class="decline-friendship-request-button" data-friend-username="${user}">
            <img src="/src/images/red_cross.png" alt="cancel">
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
}

// Function to load friendship requests
export async function loadFriendshipRequests() {
    try {
        const friendshipRequestsResponse = await fetch('/api/user/get_received_friendship_requests/');
        const friendshipRequestsData = await friendshipRequestsResponse.json();

        // Use for...of loop to iterate over requests and await each addFriendshipRequestToMenu call
        for (const request of friendshipRequestsData.requests) {
            await addFriendshipRequestToMenu(request.username, request.avatar);
        }
    } catch (error) {
        console.error('Error loading friendship requests:', error);
    }
}
