import { navigateTo, cleanUrl } from "./contentLoader.js";
import { connectFriendsWebsocket } from "./friends.js";

export var currentUser = {};
export let csrfToken = '';

export async function getCurrentUserInfo(){
    const userData = await fetch('/api/user/info/');
    currentUser = await userData.json();
}

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
        await getCurrentUserInfo();
        await connectFriendsWebsocket();
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
        await getCurrentUserInfo();
        await connectFriendsWebsocket();
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
        currentUser = {};
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
    if (!token || !params.get('username'))
        navigateTo('/login', false)

    const takeIntraPic = document.getElementById('intra-pic-checkbox').checked;
    const signupData = {
        token: token,
        username: formData.get('username'),
        password: formData.get('password'),
        confirm_password: formData.get('confirm_password'),
        take_intra_pic: takeIntraPic,
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
        await getCurrentUserInfo();
        await connectFriendsWebsocket();
        cleanUrl()
        navigateTo('/home', false);
    } else {
        alert(data.error);
    }
}
