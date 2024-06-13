import { renderLogin, renderHome, renderSignup } from './render.js';
import Page from "./page.js";
import {handleLogin} from "./auth.js";
import launch from "../main.js";

export const app = document.getElementById('app');

export function navigateTo(route) {
    history.pushState({route: route}, 'SPA Application', route);
    updateContent(route);
}

// Écouter les événements de l'API History
window.addEventListener('popstate', function (event) {
    var route = event.state.route;
    // Mettre à jour le contenu de la page en fonction de la route
    updateContent(route);
});

function updateContent(route) {
    if (route === '/login' || route === '/login/') {
        renderLogin()
    } else if (route === '/signup' || route === '/signup/') {
        renderSignup()
    } else if (route === '/') {
        renderHome()
    } else {
        navigateTo('/')
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadPages();
    document.getElementById('js-error').remove()
    navigateTo(window.location.pathname)
});


async function loadPages() {
    await new Page("example.html")
        .withNavigation("signup-link")
        .withListener("auth-form", "submit", handleLogin)
        .build();

    await new Page("menu-start-settings.html")
        .withListener("buttonPlay", "click", launch)
        .build();
}