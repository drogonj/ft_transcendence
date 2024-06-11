import { renderLogin, renderHome, renderSignup, renderUserUpdateForm, renderConfirmRegistration } from './render.js';

export const app = document.getElementById('app');

export function navigateTo(route) {
    const currentUrl = new URL(window.location.href);
    const params = currentUrl.search; // Inclut les paramètres de requête existants
    const newRoute = route.includes('?') ? route : route + params; // Ajoutez les paramètres de requête à la nouvelle route s'ils ne sont pas déjà présents
    history.pushState({route: newRoute}, 'SPA Application', newRoute);
    updateContent(newRoute);
}

// Écouter les événements de l'API History
window.addEventListener('popstate', function (event) {
    var route = event.state.route;
    // Mettre à jour le contenu de la page en fonction de la route
    updateContent(route);
});

function updateContent(route) {
    const confirmRegistrationUrlRegex = /\/confirm-registration\/?(\?.*)?$/;

    if (route.startsWith('/login')) {
        renderLogin();
    } else if (route.startsWith('/signup')) {
        renderSignup();
    } else if (route === '/') {
        renderHome();
    } else if (route.startsWith('/update')) {
        renderUserUpdateForm();
    } else if (confirmRegistrationUrlRegex.test(route)) {
        renderConfirmRegistration();
    } else {
        navigateTo('/');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('js-error').remove();
    navigateTo(window.location.pathname + window.location.search);
});
