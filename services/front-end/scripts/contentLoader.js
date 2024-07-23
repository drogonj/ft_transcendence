import {
    renderLogin,
    renderHome,
    renderSignup,
    renderUserUpdateForm,
    renderConfirmRegistration,
    renderUserProfile
} from './render.js';
import {getCurrentUserInfo, handleLogin} from "./auth.js";
import { connectFriendsWebsocket } from "./friends.js";
import Page, {renderPageWithName} from "./page.js";
import launch from "../local-game-pong/src/main.js";
import launchClientWebSocket from "../online-game-pong/websocket.js";

export const app = document.getElementById('app');

export function cleanUrl() {
    const currentUrl = new URL(window.location.href);
    const newUrl = currentUrl.origin + currentUrl.pathname; // Conserve uniquement l'origine et le chemin sans les paramètres
    history.replaceState({ route: newUrl }, 'SPA Application', newUrl);
}

const confirmRegistrationUrlRegex = /\/confirm-registration\/?(\?.*)?$/;
const profileRegex = /\/profile\/(\d+)/;

export function navigateTo(route, pushState, data) {
    if (pushState)
        history.pushState({route: route}, 'SPA Application', route);
    else
        history.replaceState({route: route}, 'SPA Application', route);

    const url = window.location.href;

    if (route === '/login' || route === '/login/') {
        renderLogin();
    } else if (route === '/signup' || route === '/signup/') {
        renderSignup();
    } else if (route === '/home' || route === '/home/') {
        renderHome();
    } else if (route === '/update' || route === '/update/') {
        renderUserUpdateForm();
    } else if (confirmRegistrationUrlRegex.test(route)) {
        renderConfirmRegistration();
    } else if (profileRegex.test(route)) {
        const userId = url.match(/\/profile\/(\d+)\//)[1];
        renderUserProfile(userId);
    } else if (route === '/game' || route === '/game/') {
        renderPageWithName("menu-start-settings.html");
    } else if (route === '/game-online' || route === '/game-online/') {
        renderPageWithName("pong-game-waiting.html");
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

document.addEventListener('DOMContentLoaded', async function() {
    await loadPages();
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

async function loadPages() {
    await new Page("menu-start-settings.html")
        .withListener("buttonPlay", "click", launch)
        .build();

    await new Page("pong-game.html")
        .build();

    await new Page("pong-game-online.html")
        .build();

    await new Page("pong-game-waiting.html")
        .withListener("test", "click", launchClientWebSocket)
        .build();

    await new Page("menu-end.html")
        .build();
}