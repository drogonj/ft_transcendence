import { getCsrfToken, csrfToken } from "./auth.js";

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
    if (data.message) {
        alert(data.message);
    } else {
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
        alert(responseData.message);
    }
}

export async function acceptFriendshipRequest(event) {
    const button = event.currentTarget;
    const friendUsername = button.dataset.friendUsername;

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
        alert(responseData.message);
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
        body: JSON.stringify({ username: friendUsername })
    });

    const responseData = await response.json();
    if (response.ok) {
        const divId = "friendship-request-" + friendUsername
        const element = document.getElementById(divId);
        element.remove();
        alert(responseData.message);
    }
}

export async function getFriendsListAsHtml() {
    const friendsResponse = await fetch('/api/user/get_friends/');
    const friendsData = await friendsResponse.json();

    let friendsList = '<ul id="friends-content" class="friend-menu-content active">';
    friendsData.friends.forEach(friend => {
        friendsList += `
                <li id="friend-${friend.username}">
                    <div class="avatar-container">
                        <img class="avatar" src="${friend.avatar}" alt="${friend.username}'s Avatar">
                    </div>
                    <p>${friend.username}
                    <button class="delete-friend-button" data-friend-username="${friend.username}">
                        <img src="/src/images/red_cross.png" alt="remove">
                    </button>
                </li>
            `;
    });
    friendsList += '</ul>'
    return friendsList
}

export async function getFriendshipRequestsListAsHtml() {
    const friendshipRequestsResponse = await fetch('/api/user/get_received_friendship_requests/');
    const friendshipRequestsData = await friendshipRequestsResponse.json();

    let friendshipRequestsList = '<ul id="requests-content" class="friend-menu-content">';
    friendshipRequestsData.requests.forEach(request => {
        friendshipRequestsList += `
                <li id="friendship-request-${request.username}">
                    <div class="avatar-container">
                        <img class="avatar" src="${request.avatar}" alt="${request.username}'s Avatar">
                    </div>
                    <p>${request.username}</p>
                    <button class="accept-friendship-request-button" data-friend-username="${request.username}">
                        <img src="/src/images/green_check.png" alt="accept">
                    </button>
                    <button class="decline-friendship-request-button" data-friend-username="${request.username}">
                        <img src="/src/images/red_cross.png" alt="cancel">
                    </button>
                </li>
            `;
    });
    friendshipRequestsList += '</ul>'
    return friendshipRequestsList
}