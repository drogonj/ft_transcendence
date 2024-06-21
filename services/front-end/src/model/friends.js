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
