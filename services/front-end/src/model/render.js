import { navigateTo, app } from './contentLoader.js';
import { handleLogin, handleSignup, handleLogout, handleUserUpdate , handleConfirmRegistration, getCsrfToken, csrfToken } from './auth.js';
import { addFriend } from './friends.js';

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

// export function renderResetPassword() {
//     app.innerHTML = `
//         <section>
//             <div class="auth-box">
//                 <div class="content">
//                     <h2>Reset Password</h2>
//                     <form id="reset-password-form" class="form">
//                         <div class="inputBox">
//                             <input type="email" id="email" name="email" required>
//                             <i>Email</i>
//                         </div>
//                         <div class="inputBox">
//                             <input type="submit" value="Reset Password">
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         </section>
//     `;
//     document.getElementById('reset-password-form').addEventListener('submit', handleResetPassword);
// }


export async function renderHome() {
    const response = await fetch('/api/user/is_authenticated/');
    const data = await response.json();
    if (data.is_authenticated) {

        // Fetch friends list
        const friendsResponse = await fetch('/api/user/get_friends/');
        const friendsData = await friendsResponse.json();

        let friendsList = '';
        friendsData.friends.forEach(friend => {
            friendsList += `
                <div id="${friend.username}">
                    <p>${friend.username}</p>
                    <img src="${friend.avatar}" alt="${friend.username}'s Avatar">
                    <button class="delete-friend-button" data-friend-username="${friend.username}">Delete</button>
                </div>
            `;
        });

        // Fetch friendship requests list
        const friendshipRequestsResponse = await fetch('/api/user/get_received_friendship_requests/');
        const friendshipRequestsData = await friendshipRequestsResponse.json();

        let friendshipRequestsList = '';
        friendshipRequestsData.requests.forEach(request => {
            friendshipRequestsList += `
                <div>
                    <p>${request.username}</p>
                    <img src="${request.avatar}" alt="${request.username}'s Avatar">
                </div>
            `;
        });

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
                        <div id="friends-list">
                            <h3>--- Friends list ---</h3>
                            ${friendsList}
                        </div>
                        <div id="friendship-requests-list">
                            <h3>--- Friendship requests list ---</h3>
                            ${friendshipRequestsList}
                            <h3>--------------------</h3>
                        </div>
                        <p id="add-friend-response"></p>
                    `;

        // Ajoutez un écouteur d'événement pour chaque bouton "Supprimer"
        document.querySelectorAll('.delete-friend-button').forEach(button => {
            button.addEventListener('click', async () => {
                const friendUsername = button.dataset.friendUsername;

                await getCsrfToken();

                const response = await fetch('/api/user/remove_friend/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({ friend_username: friendUsername })
                });

                const responseData = await response.json();
                if (response.ok) {
                    const element = document.getElementById(friendUsername);
                    element.remove();
                    alert(responseData.message);
                }
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