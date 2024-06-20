import { navigateTo, cleanUrl } from "./contentLoader.js";

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

// export async function handleResetPasswordLink(event) {
//     event.preventDefault();
//     navigateTo('/reset-password');
// }

// export async function handleResetPassword(event) {
//     event.preventDefault();
//     const email = document.getElementById('email').value;

//     await getCsrfToken();

//     const response = await fetch('/api/reset-password/', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'X-CSRFToken': csrfToken
//         },
//         body: JSON.stringify({ email: email })
//     });
//     const data = await response.json();
//     if (data.success) {
//         alert('Un email de réinitialisation de mot de passe a été envoyé à votre adresse email.');
//     } else {
//         alert('Échec de la réinitialisation de mot de passe : ' + data.message);
//     }
// }

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
        renderUserProfile();
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
