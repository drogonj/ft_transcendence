import {navigateTo, app, cleanUrl} from './contentLoader.js';
import { handleLogin, handleSignup, handleLogout, handleUserUpdate , handleConfirmRegistration, currentUser, getCsrfToken, csrfToken } from './auth.js';
import {
    connectFriendsWebsocket,
    disconnectFriendsWebsocket,
    addFriend,
    removeFriend,
    acceptFriendshipRequest,
    declineFriendshipRequest,
    loadFriends,
    loadFriendshipRequests,
    addFriendshipRequestToMenu,
    addFriendToMenu,
    changeFriendStatus,
    handleUserSearch,
} from './friends.js';

export function renderLogin() {
    app.innerHTML = `
                    <section class="auth-section">
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
                     <section class="auth-section">
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
    app.innerHTML = `
                    <h3 id="transcendence-title">
                        <span class="ltr">F</span>
                        <span class="ltr">T</span>
                        <span class="ltr">_</span>
                        <span class="ltr">T</span>
                        <span class="ltr">R</span>
                        <span class="ltr">A</span>
                        <span class="ltr">N</span>
                        <span class="ltr">S</span>
                        <span class="ltr">C</span>
                        <span class="ltr">E</span>
                        <span class="ltr">N</span>
                        <span class="ltr">D</span>
                        <span class="ltr">E</span>
                        <span class="ltr">N</span>
                        <span class="ltr">C</span>
                        <span class="ltr">E</span>
                    </h3>
                    <div class="profile-card">
                        <div id="avatar-display">
                            <div id="avatar-container">
                                <img src="/api/user/get_avatar/" alt="avatar" id="avatar"/>
                            </div>
                        </div>
                        <p>${currentUser.username}</p>
                        <div class="buttons">
                            <a href="#" id="profile-button">Show profile</a>
                            <a href="#" id="update-user-info">Change profile</a>  
                            <a href="#" id="logout-button">Logout</a>
                        </div>
                        <span class="left"></span>
                        <span class="bottom"></span>
                    </div>
                    <button id="launch-game">Launch game</button>
                    <button id="launch-game-online">Launch game online</button>
                    <div class="friend-menu-container">
                        <button id="friend-menu-button" class="friend-menu-button">Amis</button>
                        <div id="friend-menu" class="friend-menu">
                            <div class="friend-menu-header">
                                <button id="friends-button">Amis</button>
                                <button id="requests-button">Demandes d'amis</button>
                                <button id="add-friend-button">Ajouter un ami</button>
                             </div>
                             <ul id="friends-content" class="friend-menu-content active"></ul>
                             <ul id="requests-content" class="friend-menu-content"></ul>
                             <ul id="add-friend" class="friend-menu-content">
                              <div id="search-bar">
                              <form id="search-user-form">
                                   <input type="text" id="search-query" name="q" required>
                                   <i>Username</i>
                                   <input type="submit" value="search">
                               </form>
                              </div>
                              <div id="search-results"></div>
                            </ul>
                        </div>
                    </div>
                `;

	// const chatServiceStatus = await checkChatService();
	// if (chatServiceStatus.status === 'ok') {
    //     // Ajouter le bouton spécifique si le service est actif
    //     app.innerHTML += `
    //         <button id="chat-service-button">Service Chat Disponible</button>
    //     `;
    // } else {
    //     // Afficher une notification ou un message alternatif
    //     console.log("Le service de chat n'est pas disponible.");
    // }
	await renderChatApp();
    // Fetch friends list
    await loadFriends();
    // Fetch friendship requests list
    await loadFriendshipRequests();

    document.getElementById('update-user-info').addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/update/', true);
    });
    document.getElementById('profile-button').addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo(`/profile/${currentUser.user_id}/`, true);
    });
    document.getElementById('search-user-form').addEventListener('submit', handleUserSearch);
    document.getElementById('logout-button').addEventListener('click', (event) => {
        handleLogout();
        disconnectFriendsWebsocket();
    });
    document.getElementById('launch-game').addEventListener('click', (event) => {
        navigateTo('/game', true);
    });

    document.getElementById('launch-game-online').addEventListener('click', (event) => {
        navigateTo('/game-online', true);
        let ws = new WebSocket("ws://localhost:2605/api/back");
        ws.onopen = function(event) {
            console.log("WebSocket is open now.");
            ws.send("Hello, server!");
        };

        ws.onmessage = function (event) {
            console.log(event.data);
        };

        document.addEventListener("click", () => {
            ws.send("Clicked");
        })
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
}

export async function renderUserUpdateForm() {
    const response = await fetch('/api/user/info/');

    try {
        const userData = await response.json();

        app.innerHTML = `
        <h2>Update User Information</h2>
        <form id="user-update-form">
            <div>
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" value="${userData.username}" required>
            </div>
            <div>
                <label for="profil_image">Profile Picture:</label>
                <input type="file" id="profil_image" name="profil_image" accept="image/*">
            </div>
            <button type="submit">Update</button>
        </form>
        <button id="home">Home</button>
    `;
        document.getElementById('user-update-form').addEventListener('submit', handleUserUpdate);
        document.getElementById('home').addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo('/');
        });
    } catch (error) {
        navigateTo('/login');
    }
}

export async function renderConfirmRegistration() {
    app.innerHTML = `
                    <section class="auth-section">
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
                          <div class="take-intra-pic">
                            <input type="checkbox" id="intra-pic-checkbox" name="intra-pic-checkbox" checked />
                            <label for="intra-pic-checkbox">Take intra picture</label>
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

export async function renderUserProfile(userId) {
    const response = await fetch(`/api/user/profile/${userId}/`);

    if (!response.ok) {
        navigateTo('/home');
    }

    const userData = await response.json();

    app.innerHTML = `
        <div class="profile-container">
            <h1>User Profile</h1>
            <div class="profile-picture">
                <img src="${userData.avatar}" alt="Profile Picture">
            </div>
            <div class="profile-details">
                <p><strong>Username:</strong> ${userData.username}</p>
            </div> 
        </div>
        <button id="home">Home</button>
    `;
    document.getElementById('home').addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/', true);
    });
}

export async function renderChat(userId) {
    const response = await fetch(`/api/user/profile/${userId}/`);

    if (!response.ok) {
        navigateTo('/home');
    }

    const userData = await response.json();

    app.innerHTML = `
        <div class="profile-container">
            <h1>User Profile</h1>
            <div class="profile-picture">
                <img src="${userData.avatar}" alt="Profile Picture">
            </div>
            <div class="profile-details">
                <p><strong>Username:</strong> ${userData.username}</p>
            </div> 
        </div>
        <button id="home">Home</button>
    `;
    document.getElementById('home').addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/', true);
    });
}

export async function renderChatApp() {
	app.innerHTML += `
    	<div class="chat-menu-container">
			<button id="chat-menu-button" class="chat-menu-button">Chat</button>
			<div id="chat-menu" class="chat-menu">
				<div class="chat-menu-header">
					<button id="-button">Amis</button>
				</div>
				<ul id="friends-content" class="chat-menu-content active"></ul>
				<ul id="requests-content" class="chat-menu-content"></ul>
				<ul id="add-chat" class="chat-menu-content">
				<div id="search-bar">
					<form id="search-user-form">
						<input type="text" id="search-query" name="q" required>
						<i>Username</i>
						<input type="submit" value="search">
					</form>
				</div>
			<div id="search-results"></div>
			</ul>
		</div>
	`;

	document.getElementById('chat-menu-button').addEventListener('click', function() {
        let chatMenu = document.getElementById('chat-menu');
        let chatMenuButton = document.getElementById('chat-menu-button');
        if (chatMenu.style.maxHeight) {
            chatMenuButton.style.borderRadius = "5px 5px 0 0";
            chatMenu.style.maxHeight = null;
        } else {
            chatMenuButton.style.borderRadius = "0";
            chatMenu.style.maxHeight = "500px";
        }
    });
}