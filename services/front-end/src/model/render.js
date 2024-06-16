import { navigateTo, app } from './contentLoader.js';
import { handleLogin, handleSignup, handleLogout } from './auth.js';
import loadSettings from '../controller/settings.js';
import { launch } from '../view/game.js';

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
        history.pushState({}, 'Home Page', '/home');
        app.innerHTML = `
                        <h1>Home Page</h1>
                        <p>Logged in as ${data.current_user}</p>
                        <button id="logout-button">Logout</button>
                        <button id="launch-game">Launch game</button>
                    `;
        document.getElementById('logout-button').addEventListener('click', handleLogout);
        document.getElementById('launch-game').addEventListener('click', renderSettings);
    } else {
        navigateTo('/login');
    }
}

function renderSettings() {
    app.innerHTML = `
        <div id="menuStart" class="menu">
        <h1>Game settings</h1>

        <output class="menuItem">Paddle Move Speed</output>
        <input id="inputPaddleMoveSpeed" class="menuItem slider" type="range" min="3" max="25" value="10">

        <output class="menuItem">Ball Move Speed</output>
        <input id="inputBallSpeed" class="menuItem slider" type="range" min="3" max="25" value="20">

        <output class="menuItem">Number of ball</output>
        <input id="inputNumberBall" class="menuItem slider" type="range" min="1" max="20" value="1">

        <output class="menuItem">Bounce max Angle</output>
        <input id="inputBounceMaxAngle" class="menuItem slider" type="range" min="20" max="75" value="40">

        <output class="menuItem">Max game time</output>
        <input id="inputMaxGameTime" class="menuItem slider" type="range" min="1" max="15" value="5">

        <output class="menuItem">AI opponent</output>

        <label class="container menuItem">
            <input id="inputAI" type="checkbox" />
            <span class="checkmark"></span>
        </label>

        <output class="menuItem">Enable sounds</output>

        <label class="container menuItem">
            <input id="inputEnableSounds" type="checkbox" />
            <span class="checkmark"></span>
        </label>

        <button id="buttonPlay" class="menuItem button">Play</button>
    </div>
    `;
    document.getElementById("buttonPlay").addEventListener("click", () => {
        loadSettings(document.getElementsByTagName("input"));
        renderGame();
    });
}

function renderGame() {
    app.innerHTML = `
    <div id="main" style="display: none">
    <div id="header">
        <div id="headerLeft">
            <p class="scorePlayer">0</p>
            <div class="spellNameAndElo">
                <div class="playerNameAndElo">
                    <p>Player Left</p>
                    <p class="playerElo">(4987)</p>
                </div>
                <div class="spellContainer">
                    <div class="spell">a</div>
                    <div class="spell">b</div>
                    <div class="spell">c</div>
                    <div class="spell">d</div>
                </div>
            </div>
        </div>
        <div id="headerMiddle">
            <h1 id="headerTimer">10</h1>
        </div>
        <div id="headerRight">
            <div class="spellNameAndElo">
                <div class="playerNameAndElo">
                    <p class="playerElo">(15648)</p>
                    <p>Player Right</p>
                </div>
                <div class="spellContainer">
                    <div class="spell">a</div>
                    <div class="spell">b</div>
                    <div class="spell">c</div>
                    <div class="spell">d</div>
                </div>
            </div>
            <p class="scorePlayer">0</p>
        </div>
    </div>
    <div id="map" class="centerLine">
        <div id="paddleLeft" class="playerPaddle"></div>
        <div id="paddleRight" class="playerPaddle"></div>
    </div>
    </div>
    `;
    document.getElementById("main").style.display = "block";
    launch();
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