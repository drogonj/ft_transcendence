import {
    renderLogin,
    renderHome,
    renderSignup,
    renderConfirmRegistration,
    cancelMatchMaking,
    renderGameWaiting,
    renderGameSettings,
    renderGameLocal,
    renderGameOnline,
    renderGameEnd,
    renderUserProfile,
    renderSelfProfile
} from './render.js';
import {getCsrfToken, getCurrentUserInfo, handleLogin} from "./auth.js";
import {connectFriendsWebsocket} from "./friends.js";

export const app = document.getElementById('app');

export function getHostNameFromURL() {
    return window.location.hostname + (window.location.port ? ":" + window.location.port : "");
}

export function cleanUrl() {
    const currentUrl = new URL(window.location.href);
    const newUrl = currentUrl.origin + currentUrl.pathname; // Conserve uniquement l'origine et le chemin sans les paramètres
    history.replaceState({route: newUrl}, 'SPA Application', newUrl);
}

const confirmRegistrationUrlRegex = /\/confirm-registration\/?(\?.*)?$/;
const profileRegex = /\/profile\/(\d+)\/?/;

export function navigateTo(route, pushState, data) {
    if (pushState)
        history.pushState({route: route}, 'SPA Application', route);
    else
        history.replaceState({route: route}, 'SPA Application', route);

    let url = window.location.href;

    if (route === '/login' || route === '/login/') {
        renderLogin();
    } else if (route === '/signup' || route === '/signup/') {
        renderSignup();
    } else if (route === '/home' || route === '/home/') {
        renderHome();
    } else if (confirmRegistrationUrlRegex.test(route)) {
        renderConfirmRegistration();
    } else if (route === '/profile' || route === '/profile/') {
        renderSelfProfile();
    } else if (profileRegex.test(route)) {
        if (!url.endsWith('/')) {
            url += '/';
        }
        const userId = url.match(/\/profile\/(\d+)\//)[1];
        renderUserProfile(userId);
    } else if (route === '/game-settings' || route === '/game-settings/') {
        renderGameSettings();
    } else if (route === '/game-local' || route === '/game-local/') {
        renderGameLocal();
    } else if (route === '/game-online' || route === '/game-online/') {
        renderGameOnline();
    } else if (route === '/waiting-screen' || route === '/waiting-screen/') {
        renderGameWaiting();
    } else if (route === '/game-end' || route === '/game-end/') {
        renderGameEnd();
    } else {
        navigateTo('/home', false);
    }
}

// Écouter les événements de l'API History
window.addEventListener('popstate', function (event) {
    if (event.state) {
        var route = event.state.route;
        navigateTo(route, false);
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    const jsError = document.getElementById('js-error');
    if (jsError) {
        jsError.remove();
    }

    try {
        const response = await fetch('/api/user/is_authenticated/');
        const data = await response.json();

        const route = window.location.pathname + window.location.search;

        if (data.is_authenticated || confirmRegistrationUrlRegex.test(route)) {
            if (data.is_authenticated) {
                await getCurrentUserInfo();
                await connectFriendsWebsocket();
            }
            navigateTo(route, false);
        } else {
            navigateTo('/login', false);
        }
    } catch (error) {
        console.error('Error fetching authentication status:', error);
    }
});
