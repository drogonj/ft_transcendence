import { navigateTo, app } from './contentLoader.js';
import { handleLogin, handleSignup, handleLogout, handleUserUpdate , handleConfirmRegistration, getCsrfToken, csrfToken } from './auth.js';
import {
    addFriend,
    removeFriend,
    acceptFriendshipRequest,
    declineFriendshipRequest,
    getFriendsListAsHtml,
    getFriendshipRequestsListAsHtml
} from './friends.js';

export function renderLogin() {
    app.innerHTML = `
                    <section>
                       <div class="auth-box">
                        <div class="content">
                         <h2>Login</h2>
                         <form id="auth-form" class="form">
                          <div class="inputBox">
                           <input type="text" id="username" name="username" required>
                           <i>Username or Email</i>
                          </div>
                          <div class="inputBox">
                           <input type="password" id="password" name="password" required>
                           <i>Password</i>
                          </div>
                          <div class="links">
                            <a href="" id="signup-link">Sign up</a>
                            <a href="/api/user/oauth/redirect/" id="oauth-42-link>">Login with 42</a>
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
        navigateTo('/signup', true);
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
                           <input type="text" id="email" name="email" required>
                           <i>Email</i>
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
        navigateTo('/login', true);
    });
}

export async function renderHome() {
    const response = await fetch('/api/user/is_authenticated/');
    const data = await response.json();
    if (data.is_authenticated) {

        // Fetch friends list
        let friendsList = await getFriendsListAsHtml();

        // Fetch friendship requests list
        let friendshipRequestsList = await getFriendshipRequestsListAsHtml();

        app.innerHTML = `
                        <h1>Home Page</h1>
                        <p>Logged in as ${data.current_user}</p>
                        <div id="avatar-container">
                            <img src="/api/user/get_avatar/" alt="avatar" id="avatar"/>
                        </div>
                        <button id="logout-button">Logout</button>
                        <button id="launch-game">Launch game</button>
                        <a href="#" id="update-user-info">User update info</a>
                        <br><br>
                        <button id="add-friend-button">add friend</button>
                        <div>
                            <label for="target-username">Username:</label>
                            <input type="text" id="target-username" name="target-username" value="" required>
                        </div>
                        <div class="friend-menu-container">
                            <button id="friend-menu-button" class="friend-menu-button">Amis</button>
                            <div id="friend-menu" class="friend-menu">
                                <div class="friend-menu-header">
                                    <button id="friends-button">Amis</button>
                                    <button id="requests-button">Demandes d'amis</button>
                                    <button id="add-friend-button">Ajouter un ami</button>
                                 </div>
                                 ${friendsList}
                                 ${friendshipRequestsList}
                                <ul id="add-friend" class="friend-menu-content">
                                    <!--TODO-->
                                </ul>
                            </div>
                        </div>
                    `;

        document.querySelectorAll('.delete-friend-button').forEach(button => {
            button.addEventListener('click', async () => {
                await removeFriend(event)
            });
        });
        document.querySelectorAll('.accept-friendship-request-button').forEach(button => {
            button.addEventListener('click', async () => {
                await acceptFriendshipRequest(event)
            });
        });
        document.querySelectorAll('.decline-friendship-request-button').forEach(button => {
            button.addEventListener('click', async () => {
                await declineFriendshipRequest(event)
            });
        });
        document.getElementById('logout-button').addEventListener('click', handleLogout);
        document.getElementById('add-friend-button').addEventListener('click', addFriend);
        document.getElementById('launch-game').addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo('/game', true);
        });
        document.getElementById('update-user-info').addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo('/update/', true);
        });

        document.getElementById('friend-menu-button').addEventListener('click', function() {
            let menu = document.getElementById('friend-menu');
            let menuButton = document.getElementById('friend-menu-button');
            if (menu.style.maxHeight) {
                menuButton.style.borderRadius = "5px 5px 0 0";
                menu.style.maxHeight = null;
            } else {
                menuButton.style.borderRadius = "0";
                menu.style.maxHeight = "500px";
            }
        });

        document.getElementById('friends-button').addEventListener('click', function() {
            document.getElementById('friends-content').classList.add('active');
            document.getElementById('add-friend').classList.remove('active');
            document.getElementById('requests-content').classList.remove('active');
        });

        document.getElementById('requests-button').addEventListener('click', function() {
            document.getElementById('requests-content').classList.add('active');
            document.getElementById('add-friend').classList.remove('active');
            document.getElementById('friends-content').classList.remove('active');
        });

        document.getElementById('add-friend-button').addEventListener('click', function() {
            document.getElementById('add-friend').classList.add('active');
            document.getElementById('friends-content').classList.remove('active');
            document.getElementById('requests-content').classList.remove('active');
        });

        const socket = new WebSocket('wss://localhost:8080/ws/friend-requests/');

        socket.onopen = function(e) {
            console.log("WebSocket connection established.");
        };

        socket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            const type = data.type
            console.log('pute')
            console.log(data)

            if (type === 'friend_request_notification') {
                const from_user = data.from_user
                const avatar = data.avatar

                const friendshipRequestsContainer = document.getElementById('requests-content');

                // Créer un nouvel élément li pour la nouvelle demande d'amitié
                const newFriendshipRequest = document.createElement('li');
                newFriendshipRequest.id = `friendship-request-${from_user}`;

                // Structure HTML de la demande d'amitié
                newFriendshipRequest.innerHTML = `
                        <div class="avatar-container">
                            <img class="avatar" src="${avatar}" alt="${from_user}'s Avatar">
                        </div>
                        <p>${from_user}</p>
                        <button class="accept-friendship-request-button" data-friend-username="${from_user}">
                            <img src="/src/images/green_check.png" alt="accept">
                        </button>
                        <button class="decline-friendship-request-button" data-friend-username="${from_user}">
                            <img src="/src/images/red_cross.png" alt="cancel">
                        </button>
                 `;

                // Ajouter le nouvel élément à la liste existante
                friendshipRequestsContainer.insertAdjacentElement('beforeend', newFriendshipRequest);
            }
        };

        socket.onclose = function(event) {
            if (event.wasClean) {
                console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                console.log('[close] Connection died');
            }
        };

        socket.onerror = function(error) {
            console.error(`[error] ${error.message}`);
        };
    } else {
        navigateTo('/login', false);
    }
}

export async function renderUserUpdateForm() {
    const response = await fetch('/api/user/info/');
    const userData = await response.json();

    app.innerHTML = `
        <h2>Update User Information</h2>
        <form id="user-update-form">
            <div>
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" value="${userData.username}" required>
            </div>
            <div>
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" value="${userData.email}" required>
            </div>
            <div>
                <label for="profil_image">Profile Picture:</label>
                <input type="file" id="profil_image" name="profil_image" accept="image/*">
            </div>
            <button type="submit">Update</button>
        </form>
    `;

    document.getElementById('user-update-form').addEventListener('submit', handleUserUpdate);
}

export async function renderConfirmRegistration() {
    const response = await fetch('/api/user/is_authenticated/');
    const data = await response.json();
    if (data.is_authenticated) {
        navigateTo('/home', false)
    } else {
        app.innerHTML = `
                        <section>
                           <div class="auth-box">
                            <div class="content">
                             <h2>Confirm Registration</h2>
                             <p>We ask to create new username & password for your first connection, you will be able to connect via 'Login to 42' button the next times</p>
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
                                <a href="" id="login-link">Login</a>
                              </div>
                              <div class="inputBox">
                               <input type="submit" value="Confirm Registration">
                              </div>
                             </form>
                            </div>
                           </div>
                          </section>
                    `;
        const url = new URL(window.location.href)
        const params = new URLSearchParams(url.search)
        const username = params.get('username')
        document.getElementById('username').setAttribute('value', username);
        document.getElementById('auth-form').addEventListener('submit', handleConfirmRegistration);
        document.getElementById('login-link').addEventListener('click', function (event) {
            event.preventDefault();
            navigateTo('/login', true);
        });
    }
}

export function renderGame() {
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