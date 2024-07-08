import Page from "./page.js";
import {handleLogin} from "./auth.js";
import launch from "../main.js";
import { renderLogin, renderHome, renderSignup, renderUserUpdateForm, renderConfirmRegistration, renderGame } from './render.js';

export const app = document.getElementById('app');

export function cleanUrl() {
    const currentUrl = new URL(window.location.href);
    const newUrl = currentUrl.origin + currentUrl.pathname; // Conserve uniquement l'origine et le chemin sans les paramètres
    history.replaceState({ route: newUrl }, 'SPA Application', newUrl);
}

export function navigateTo(route, pushState) {
    if (pushState)
        history.pushState({route: route}, 'SPA Application', route);
    else
        history.replaceState({route: route}, 'SPA Application', route);

    const confirmRegistrationUrlRegex = /\/confirm-registration\/?(\?.*)?$/;

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
    } else if (route === '/game' || route === '/game/') {
        renderGame();
    } else {
        navigateTo('/home', false)
    }
}

// Écouter les événements de l'API History
window.addEventListener('popstate', function (event) {
    if (event.state) {
        var route = event.state.route;
        navigateTo(route, false);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    loadPages();
    document.getElementById('js-error').remove();
    navigateTo(window.location.pathname + window.location.search, false);
});


async function loadPages() {
    await new Page("example.html")
        .withNavigation("signup-link")
        .withListener("auth-form", "submit", handleLogin)
        .build();

    await new Page("menu-start-settings.html")
        .withListener("buttonPlay", "click", launch)
        .build();

    await new Page("pong-game.html")
        .build();

    await new Page("menu-end.html")
        .build();
}