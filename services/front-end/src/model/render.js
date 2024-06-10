import { navigateTo, app } from './contentLoader.js';
import { handleLogin, handleSignup, handleLogout } from './auth.js';

export function renderLogin() {
    app.innerHTML = `
                    <section>
                       <div class="auth-box">
                        <div class="content">
                         <h2>Login</h2>
                         <form id="auth-form" class="form">
                          <div class="inputBox">
                           <input type="text" id="username" name="username" required>
                           <i>Username</i>
                          </div>
                          <div class="inputBox">
                           <input type="password" id="password" name="password" required>
                           <i>Password</i>
                          </div>
                          <div class="links">
                            <a href="#" id="signup-link">Sign up</a>
                          </div>
                          <div class="inputBox">
                           <input type="submit" value="Login">
                          </div>
                         </form>
                        </div>
                       </div>
                      </section>
                `;
    document.getElementById('auth-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-link').addEventListener('click', function(event) {
        event.preventDefault();
        navigateTo('/signup');
    });
}

export function renderSignup() {
    app.innerHTML = `
                     <section>
                       <div class="auth-box">
                        <div class="content">
                         <h2>Sign up</h2>
                         <form id="auth-form" class="form">
                          <div class="inputBox">
                           <input type="text" id="username" name="username" required>
                           <i>Username</i>
                          </div>
                          <div class="inputBox">
                           <input type="password" id="password" name="password" required>
                           <i>Password</i>
                          </div>
                           <div class="inputBox" id="confirm-passw-box">
                               <input type="password" id="confirm_password" name="confirm_password" required>
                               <i>Confirm password</i>
                          </div>
                          <div class="links">
                            <a href="#" id="login-link">Login</a>
                          </div>
                          <div class="inputBox">
                           <input type="submit" value="Sign up">
                          </div>
                         </form>
                        </div>
                       </div>
                      </section>
            `;
    document.getElementById('auth-form').addEventListener('submit', handleSignup);
    document.getElementById('login-link').addEventListener('click', function(event) {
        event.preventDefault();
        navigateTo('/login');
    });
}

export async function renderHome() {
    const response = await fetch('/api/user/is_authenticated/');
    const data = await response.json();
    if (data.is_authenticated) {
        app.innerHTML = `
                        <h1>Home Page</h1>
                        <p>Logged in as ${data.current_user}</p>
                        <button id="logout-button">Logout</button>
                        <button id="launch-game">Launch game</button>
                    `;
        document.getElementById('logout-button').addEventListener('click', handleLogout);
        document.getElementById('launch-game').addEventListener('click', renderGame);
    } else {
        navigateTo('/login');
    }
}

function renderGame() {
    app.innerHTML = `
                     <div id="main">
                        <div id="header"> </div>
                        <div id="map">
                            <div class="playerPaddle"></div>
                            <div class="ball"></div>
                        </div>
                     </div>
                `;
}

function loadPage(page) {
    fetch(page)
        .then(response => response.text())
        .then(html => {
            document.getElementById('app').innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading page:', error);
        });
}