import { renderLogin, renderHome, renderSignup, renderUserUpdateForm, renderConfirmRegistration } from './render.js';

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

    // const currentUrl = new URL(window.location.href);
    // const params = currentUrl.search;
    // const newRoute = route.includes('?') ? route : route + params;
    const confirmRegistrationUrlRegex = /\/confirm-registration\/?(\?.*)?$/;

    if (route === '/login' || route === '/login/') {
        renderLogin();
    } else if (route === '/signup' || route === '/signup/') {
        renderSignup();
    } else if (route === '/') {
        renderHome();
    } else if (route === '/update' || route === '/update/') {
        renderUserUpdateForm();
    } else if (confirmRegistrationUrlRegex.test(route)) {
        renderConfirmRegistration();
    } else {
        navigateTo('/', false);
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
    document.getElementById('js-error').remove();
    navigateTo(window.location.pathname + window.location.search, true);
});
