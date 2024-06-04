import { navigateTo } from "./contentLoader.js";

export let csrfToken = '';

async function getCsrfToken() {
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
        navigateTo('/');
    } else {
        alert('Login failed: ' + data.message);
    }
}

export async function handleSignup(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const signupData = {
        username: formData.get('username'),
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
        navigateTo('/login');
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
        navigateTo('/login');
    } else {
        alert('Logout failed: ' + data.message);
    }
}
