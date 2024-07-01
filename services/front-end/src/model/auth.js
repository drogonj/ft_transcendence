import { navigateTo, cleanUrl } from "./contentLoader.js";
import { renderUserProfile } from "./render.js";

export let csrfToken = '';

export async function getCsrfToken() {
    const response = await fetch('/api/user/get_csrf_token/');
    const data = await response.json();
    csrfToken = data.csrfToken;
}

export async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    await getCsrfToken();

    const response = await fetch('/api/user/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ username: username, password: password })
    });
    const data = await response.json();
    if (data.success) {
        navigateTo('/home', true);
    } else {
        alert('Login failed: ' + data.message);
    }
}

export async function handleSignup(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const signupData = {
        username: formData.get('username'),
        email:    formData.get('email'),
        password: formData.get('password'),
        confirm_password: formData.get('confirm_password')
    };

    await getCsrfToken();

    const response = await fetch('/api/user/signup/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify(signupData)
    });
    const data = await response.json();
    if (data.message) {
        navigateTo('/home', true);
    } else {
        alert(data.error);
    }
}

export async function handleLogout() {
    await getCsrfToken();

    const response = await fetch('/api/user/logout/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken
        }
    });
    const data = await response.json();
    if (data.success) {
        navigateTo('/login', false);
    } else {
        alert('Logout failed: ' + data.message);
    }
}

export async function handleUserUpdate(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    await getCsrfToken();

    const response = await fetch('/api/user/update/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken
        },
        body: formData
    });
    const data = await response.json();

    if (data.success) {
        // TODO
    } else {
        alert('Failed to update user information: ' + data.message);
    }
}

export async function handleConfirmRegistration(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const url = new URL(window.location.href)
    const params = new URLSearchParams(url.search)
    const token = params.get('token')
    if (!token)
        navigateTo('/home', false)
    const signupData = {
        token: token,
        username: formData.get('username'),
        password: formData.get('password'),
        confirm_password: formData.get('confirm_password'),
    };

    await getCsrfToken();

    const response = await fetch('/api/user/oauth/confirm_registration/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify(signupData)
    });
    const data = await response.json();
    if (data.message) {
        cleanUrl()
        navigateTo('/home', false);
    } else {
        alert(data.error);
    }
}

export async function handleUserSearch(event) {
    event.preventDefault();
    const query = document.getElementById('search-query').value;
    const response = await fetch(`/api/user/search/?q=${query}`);
    const data = await response.json();
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '<h2>Search Results</h2>';
    if (data.users.length > 0) {
        const resultsList = document.createElement('ul');
        data.users.forEach(user => {
            const listItem = document.createElement('li');
            const profileLink = document.createElement('a');
            profileLink.href = '#';
            profileLink.textContent = `${user.username} - ${user.email}`;
            profileLink.addEventListener('click', (event) => {
                event.preventDefault();
                navigateTo(`/profile/${user.id}/`, true);
            });
            listItem.appendChild(profileLink);
            resultsList.appendChild(listItem);
        });
        resultsContainer.appendChild(resultsList);
    } else {
        resultsContainer.innerHTML += '<p>No users found.</p>';
    }
}