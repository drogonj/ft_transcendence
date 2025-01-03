import {navigateTo, app, cleanUrl} from './contentLoader.js';
import {
    handleLogin,
    handleSignup,
    handleLogout,
    handleUserUpdate,
    handleConfirmRegistration,
    changeAvatar,
    changeUsername,
    changePassword,
    currentUser,
    getCsrfToken,
    csrfToken,
    getCurrentUserInfo
} from './auth.js';
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

import { addChatMenu, disconnectChatWebsocket } from './chat.js';
import {closeWebSocket, isWebSocketBind, launchClientMatchMaking} from "../online-game-pong/websocket.js";
import setupLocalGame, {startlocalGame} from "../local-game-pong/src/main.js";
import { unsetIngame } from "../local-game-pong/src/main.js";
import {
    closeTournamentWebSocket,
    createTournament,
    isTournamentWebSocketBind,
    refreshTournamentList
} from "./tournament.js";

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

async function addFriendshipMenu() {
    const friendshipMenuContainer = document.querySelector('.friend-menu-container');
    friendshipMenuContainer.innerHTML = `
            <button id="friend-menu-button" class="friend-menu-button">Friends (or amis in French)</button>
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
<!--                                <i>Username</i>-->
                                <input type="submit" value="search">
                        </form>
                    </div>
                    <div id="search-results"></div>
                </ul>
            </div>
    `;
    // Fetch friends list
    await loadFriends();
    // Fetch friendship requests list
    await loadFriendshipRequests();

    document.getElementById('friend-menu-button').addEventListener('click', function() {
        let menu = document.getElementById('friend-menu');
        let menuButton = document.getElementById('friend-menu-button');
        if (menu.style.maxHeight) {
            menuButton.style.borderRadius = "5px 5px 0 0";
            menu.style.maxHeight = null;
        } else {
            menuButton.style.borderRadius = "0";
            menu.style.maxHeight = "40vh";
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

    document.getElementById('search-user-form').addEventListener('submit', handleUserSearch);
}

export async function neil() {
    const friendRequestContent = document.getElementById('requests-content');
    const friendRequestCount = friendRequestContent.childElementCount;

    const neil = document.querySelector('.neil-container');
    if (friendRequestCount > 0) {
        neil.style.left = '1%';
        const notif = document.getElementById('notif');
        notif.innerHTML = 'You have ' + friendRequestCount + ' friend request(s) !';
    } else {
        neil.style.left = '-100%';
    }
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
                                <img src="${currentUser.avatar}" alt="avatar" id="avatar"/>
                            </div>
                        </div>
                        <p>${currentUser.username}</p>
                        <div id="profile-card-trophy">
                            <p>${currentUser.trophies}</p>
                            <img alt="trophy" src="/assets/images/trophy.png">
                        </div>
                        <div class="single-chart">
                            <svg viewBox="0 0 36 36" class="circular-chart orange">
                                <path class="circle-bg" d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                                <path class="circle" stroke-dasharray="${currentUser.winrate}, 100" d="M18 2.0845
                                     a 15.9155 15.9155 0 0 1 0 31.831
                                     a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                                <text x="18" y="20.35" class="percentage">${currentUser.winrate}%</text>
                            </svg>
                            <p>winrate</p>
                        </div>
                        <div class="buttons">
                            <a href="#" id="profile-button">Show profile</a>
                            <a href="#" id="logout-button">Logout</a>
                        </div>
                        <span class="left"></span>
                        <span class="bottom"></span>
                    </div>
                    <div id="gameButtons">
                        <button id="launch-game" class="game-menu-button">Start local game</button>
                        <button id="launch-game-online" class="game-menu-button">Start online game</button>
                        <button id="tournament" class="game-menu-button">Tournament</button>
                    </div>
                    
                    <div class="friend-menu-container"></div>
                    <div class="neil-container">
                        <img alt="neil" src="/assets/images/friends/neil.gif">
                        <p id="notif"></p>
                        <span class="close-btn" id="closePopup">×</span>
                    </div>
					<div class="chat-menu-container"></div>
					<div class="cc">
                        <p>©️ ngalzand - jmathieu - ayagmur - chabrune</p>
                    </div>
                `;

    await addFriendshipMenu();
	await addChatMenu();
    await neil();

    document.getElementById('profile-button').addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo(`/profile/`, true);
    });
    document.getElementById('logout-button').addEventListener('click', (event) => {
        handleLogout();
        disconnectFriendsWebsocket();
		disconnectChatWebsocket();
    });
    document.getElementById('launch-game').addEventListener('click', (event) => {
        navigateTo('/game-settings', true);
    });

    document.getElementById('launch-game-online').addEventListener('click', (event) => {
        launchClientMatchMaking();
    });

    document.getElementById('tournament').addEventListener('click', (event) => {
        navigateTo('/tournament', true);
    });

    document.getElementById('closePopup').addEventListener('click', (event) => {
        const neil = document.querySelector('.neil-container');
        neil.style.left = '-100%';
    });
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

async function fetchMatchesHistory(userId) {
    try {
        const response = await fetch(`/api/user/get_matches/${userId}/`);
        const data = await response.json();

        let container = document.getElementById('match-history-container');

        for (const match of data.matches) {
            const element = document.createElement('span');
            const utcDate = new Date(match.date + ' UTC');
            // Convert to user's local time
            const localDate = new Date(utcDate);
            // Format the date and time in a more readable way if needed
            const formattedLocalDate = localDate.toLocaleString();

            element.className = 'match';
            element.innerHTML = `
                <p class="usernames">${match.self_username} vs ${match.opponent_username}</p>
                <p class="scores">${match.self_score} : ${match.opponent_score}</p>
                <p class="datetime">${formattedLocalDate}</p>
            `;
            container.insertAdjacentElement('afterbegin', element);
        }
    } catch (error) {
        console.log(error.message);
    }
}

export async function renderUserProfile(userId) {
    const response = await fetch(`/api/user/profile/${userId}/`);

    const userData = await response.json();

    try {
        app.innerHTML = `
            <div class="profile-section-container">
              
              <section class="profile-section">
                <h2>Profile</h2>
                <div class="profile-box">
                  <div id="avatar-display">
                    <div id="avatar-container">
                      <img src="${userData.avatar}" alt="avatar" id="avatar">
                    </div>
                  </div>
                  <p id="profile-username">${userData.username}</p>
                </div>
              </section>
                
              <section class="profile-section">
                <h2>Stats</h2>
                <div class="profile-box">
                    <div id="profile-card-trophy">
                            <p>${userData.trophies}</p>
                            <img alt="trophy" src="/assets/images/trophy.png">
                        </div>
                        <div class="single-chart">
                            <svg viewBox="0 0 36 36" class="circular-chart orange">
                                <path class="circle-bg" d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                                <path class="circle" stroke-dasharray="${userData.winrate}, 100" d="M18 2.0845
                                     a 15.9155 15.9155 0 0 1 0 31.831
                                     a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                                <text x="18" y="20.35" class="percentage">${userData.winrate}%</text>
                            </svg>
                            <p>winrate</p>
                        </div>
                    <div id="stats-text-container">
                        <p><span>Victory: </span>${userData.victories}</p>
                        <p><span>Defeat: </span>${userData.defeats}</p>
                        <p><span>Goals: </span>${userData.goals}</p>
                        <p><span>Tournaments Won: </span>${userData.tournaments_won}</p>
                    </div>
                </div>
              </section>
  
              <section class="profile-section">
                <h2>Match History</h2>
                <div class="profile-box">
                  <div id="match-history-container"></div>
                </div>
              </section>
        </div>
        <button id="home-button">Home</button>
        <div class="friend-menu-container"></div>
        `;

        await fetchMatchesHistory(userData.user_id);
        await addFriendshipMenu();

        document.getElementById('home-button').addEventListener('click', function (event) {
            event.preventDefault();
            navigateTo('/home', true);
        });

    } catch (error) {
        if (currentUser.username)
            navigateTo('/home');
        else
            navigateTo('/login');
    }
}

export async function renderSelfProfile() {
    await getCurrentUserInfo();

    try {
        app.innerHTML = `
            <div class="profile-section-container">
              

                <section class="profile-section">
                 <h2>Profile</h2>
                <div class="profile-box">
                  <div id="avatar-display">
                    <img alt="upload" id="upload-avatar" src="/assets/images/camera.png">
                    <input type="file" id="file-input" accept="image/*" style="display:none;">
                    <div id="avatar-container">
                      <img src="${currentUser.avatar}" alt="avatar" id="avatar">
                    </div>
                  </div>
                  
                  <div class="inputBox">
                    <input type="text" id="username" name="username" value="${currentUser.username}" required="">
                  </div>
                  <div class="inputBox">
                    <input type="submit" value="Change username" id="change-username-btn">
                  </div>
                  <div class="inputBox">
                    <input type="text" id="email" name="email" value="${currentUser.email}" disabled="">
                  </div>
                  
                  <div class="inputBox">
                    <input type="password" id="password" name="password" required="">
                    <i>Password</i>
                  </div>
                  <div class="inputBox">
                    <input type="password" id="new-password" name="new-password" required="">
                    <i>New Password</i>
                  </div>
                  <div class="inputBox">
                    <input type="password" id="confirm-new-password" name="confirm-new-password" required="">
                    <i>Confirm new Password</i>
                  </div>
                  <div class="inputBox">
                    <input type="submit" value="Change password" id="change-password-btn">
                  </div>
                  
                  <div id="response-message" style="display: none;"></div>
                </div>
              </section>
                
              <section class="profile-section">
                <h2>Stats</h2>
                <div class="profile-box">

                    <div id="profile-card-trophy">
                            <p>${currentUser.trophies}</p>
                            <img alt="trophy" src="/assets/images/trophy.png">
                        </div>
                        <div class="single-chart">
                            <svg viewBox="0 0 36 36" class="circular-chart orange">
                                <path class="circle-bg" d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                                <path class="circle" stroke-dasharray="${currentUser.winrate}, 100" d="M18 2.0845
                                     a 15.9155 15.9155 0 0 1 0 31.831
                                     a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                                <text x="18" y="20.35" class="percentage">${currentUser.winrate}%</text>
                            </svg>
                            <p>winrate</p>
                        </div>
                    <div id="stats-text-container">
                        <p><span>Victory: </span>${currentUser.victories}</p>
                        <p><span>Defeat: </span>${currentUser.defeats}</p>
                        <p><span>Goals: </span>${currentUser.goals}</p>
                        <p><span>Tournaments Won: </span>${currentUser.tournaments_won}</p>
                    </div>
                </div>
              </section>
  
              <section class="profile-section">
                <h2>Match History</h2>
                <div class="profile-box">
                  <div id="match-history-container"></div>
                </div>
              </section>
        </div>
        <button id="home-button">Home</button>
        <div class="friend-menu-container"></div>
        `;

        await fetchMatchesHistory(currentUser.user_id);
        await addFriendshipMenu();

        const uploadAvatar = document.getElementById('upload-avatar');
        const fileInput = document.getElementById('file-input');

        uploadAvatar.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async (event) => {
            await changeAvatar(event);
        });

        document.getElementById('change-username-btn').addEventListener('click', async function (event) {
            event.preventDefault();
            await changeUsername();
        });

        document.getElementById('change-password-btn').addEventListener('click', async function (event) {
            event.preventDefault();
            await changePassword();
        });

        document.getElementById('home-button').addEventListener('click', function (event) {
            event.preventDefault();
            navigateTo('/home', true);
        });

    } catch (error) {
        if (currentUser.username)
            navigateTo('/home');
        else
            navigateTo('/login');
    }
}

export async function renderGameWaiting() {
    if (!isWebSocketBind()) {
        navigateTo('/home', true);
        return;
    }
    app.innerHTML = `
        <div id="mainWait">
	        <h1 id="mainTitle">
		        You are in the MatchMaking. Searching game...
	        </h1>
	        <button id="matchMakingCancel" class="friend-menu-button">
		        Cancel the queue
	        </button>
		</div>
		<div class="chat-menu-container"></div>
    `;

	await addChatMenu();

    document.getElementById('matchMakingCancel').addEventListener('click', (event) => {
        closeWebSocket();
        event.preventDefault();
        navigateTo('/home', true);
    });
}

export async function renderTournament() {
    app.innerHTML = `
        <div id="tournamentmain">
            <h1 id="headerTournament">Welcome to tournament</h1>
            <div id="tournamentList">
           </div>
            <div id="footerTournament">
                <button id="createTournament" class="tournamentButton">Create</button>
                <button id="refreshTournament" class="tournamentButton">Refresh</button>
                <button id="homeTournament" class="tournamentButton">Home</button>
            </div>
        </div>
        <div class="chat-menu-container"></div>
    `;
    refreshTournamentList();
    await addChatMenu();

	await addChatMenu();

    document.getElementById("createTournament").addEventListener('click', (event) => {
        createTournament();
    })

    document.getElementById("refreshTournament").addEventListener('click', (event) => {
        refreshTournamentList();
    })

    document.getElementById('homeTournament').addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/home', true);
    });
}

export async function renderTournamentLobby() {
    if (!isTournamentWebSocketBind()) {
        navigateTo('/home', true);
        return;
    }
    app.innerHTML = `
        <div id="tournamentmain">
            <h1 id="headerTournament">Tournament Lobby</h1>
            <p1>Waiting for players..</p1>
            <div id="playerList">
            </div>
            <div id="footerTournament">
                <button id="leaveTournament" class="tournamentButton">Leave the lobby</button>
            </div>
        </div>
        <div class="chat-menu-container"></div>
    `;
    await addChatMenu();

    document.getElementById('leaveTournament').addEventListener('click', (event) => {
        event.preventDefault();
        closeTournamentWebSocket();
        navigateTo('/tournament', true);
    });
}

export async function renderGameEnd() {
    app.innerHTML = `
        <div id="menuEnd">
            <section id="gameEndHeader">
                <div id="leftPlayerHeader" class="playerHeader">
                    <div class="playerNameEnd">LeftPlayer</div>
                    <img class="playerAvatarEnd" src="../../assets/images/iconleft.jpg">
                </div>
                <div id="RightPlayerHeader" class="playerHeader">
                    <div class="playerNameEnd">RightPlayer</div>
                    <img class="playerAvatarEnd" src="../../assets/images/righticon.jpg">
                </div>
            </section>
            <section id="statistics">
                <div id="statsName">
                    <div>Final score</div>
                    <div>Touched balls</div>
                    <div>Used spells</div>
                    <div>Time without taking goals</div>
                    <div>Goals in a row</div>
                </div>
                <div id="leftPlayer" class="statsValues">
                </div>
                <div id="rightPlayer" class="statsValues">
                </div>
            </section>
            <div id="buttonContinueDiv">
                <button id="buttonContinue" class="friend-menu-button">Continue</button>
            </div>
        </div>
        <div class="chat-menu-container"></div>	
    `;
	
    await addChatMenu();

    document.getElementById('buttonContinue').addEventListener('click', async (event) => {
        event.preventDefault();
        await getCurrentUserInfo();
        navigateTo('/home', true);
    });
}

export async function renderGameSettings() {
    app.innerHTML = `
        <div id="menuStart" class="menu">
            <h1>Game settings</h1>
        
            <output class="menuItem">Paddle Move Speed</output>
            <input id="inputPaddleMoveSpeed" class="menuItem slider" type="range" min="3" max="25" value="20">
        
            <output class="menuItem">Paddle Size</output>
            <input id="inputPaddleSize" class="menuItem slider" type="range" min="5" max="40" value="20">
        
            <output class="menuItem">Ball Move Speed</output>
            <input id="inputBallSpeed" class="menuItem slider" type="range" min="6" max="20" value="11">
        
            <output class="menuItem">Ball Size</output>
            <input id="inputBallSize" class="menuItem slider" type="range" min="1" max="3" value="1.5" step="0.1">
        
            <output class="menuItem">Number of ball</output>
            <input id="inputNumberBall" class="menuItem slider" type="range" min="1" max="20" value="1">
        
            <output class="menuItem">Bounce max Angle</output>
            <input id="inputBounceMaxAngle" class="menuItem slider" type="range" min="20" max="75" value="40">
        
            <output class="menuItem">Max game time</output>
            <input id="inputMaxGameTime" class="menuItem slider" type="range" min="1" max="15" value="5">
        
            <output class="menuItem">Max score</output>
            <input id="inputMaxScore" class="menuItem slider" type="range" min="10" max="100" value="25">
        
        <output class="menuItem">Enable spells</output>
        
            <label class="container menuItem" >
                <input id="activeSpells" type="checkbox" checked/>
                <span class="checkmark"></span>
            </label>
        
            <output class="menuItem">Enable AI</output>
        
            <label class="container menuItem">
                <input id="activeAi" type="checkbox" />
                <span class="checkmark"></span>
            </label>
        
            <output class="menuItem">Respawn only if all balls gone</output>
        
            <label class="container menuItem">
                <input id="respawnIfAllBallsGone" type="checkbox" />
                <span class="checkmark"></span>
            </label>
    
            <button id="buttonPlay" class="friend-menu-button">Play</button>
        </div>
    `;
    document.getElementById('buttonPlay').addEventListener('click', (event) => {
        event.preventDefault();
        setupLocalGame();
    });
}

export async function renderGameLocal() {
    app.innerHTML = `
        <div id="main">
            <div id="mapAndHeader">
                <div id="header">
                    <div id="headerLeft">
                        <div class="iconPlayer">
                            <img src="../../assets/images/iconleft.jpg">
                        </div>
                        <div class="spellName">
                            <div class="playerName">Player Left</div>
                            <div class="spellContainer"></div>
                        </div>
                        <div class="scorePlayer">0</div>
                    </div>
        
                    <div id="headerMiddle">
                        <div id="headerTimer">11</div>
                    </div>
        
                    <div id="headerRight">
                        <div class="scorePlayer">0</div>
                        <div class="spellName">
                            <div class="playerName">Player Right</div>
                            <div class="spellContainer"></div>
                        </div>
                        <div class="iconPlayer">
                            <img src="../../assets/images/righticon.jpg">
                        </div>
                    </div>
                </div>
                <div id="map" class="centerLine">
                    <div id="paddleLeft" class="playerPaddle"></div>
                    <div id="paddleRight" class="playerPaddle"></div>
                </div>
            </div>
        </div>
        
        <div id="announcement">
            <div id="players">
                <div id="infoLeft" class="playerInfos">
                    <div class="playerData">
                        <img class="warmupImage" src="../../assets/images/iconleft.jpg">
                        <div class="infoUserName">PlayerLeft</div>
                    </div>
                    <div class="spells">
                    </div>
                </div>
                 <div id="infoRight" class="playerInfos">
                     <div class="playerData">
                        <img class="warmupImage" src="../../assets/images/righticon.jpg">
                        <div class="infoUserName">PlayerRight</div>
                    </div>
                    <div class="spells">
                    </div>
                </div>
            </div>
            <button id="buttonPlayWarmup" class="friend-menu-button">Launch the game</button>
        </div>  
        
    `;
    window.addEventListener('popstate', async function(event) {
        await unsetIngame();
    }, { once: true });

    document.getElementById('buttonPlayWarmup').addEventListener('click', () => {
        document.getElementById('announcement').remove();
        startlocalGame();
    }, { once: true })

}

export async function renderGameOnline() {
     if (!isWebSocketBind()) {
        navigateTo('/home', true);
        return;
    }
    app.innerHTML = `
        <div id="main">
            <div id="mapAndHeader">
                <div id="header">
                    <div id="headerLeft">
                        <div class="iconPlayer">
                            <img class="avatar" src="../../assets/images/iconleft.jpg">
                        </div>
                        <div class="spellName">
                            <div class="playerName">Player Left</div>
                            <div class="spellContainer"></div>
                        </div>
                        <div class="scorePlayer">0</div>
                    </div>
        
                    <div id="headerMiddle">
                        <div id="headerTimer">10</div>
                    </div>
        
                    <div id="headerRight">
                        <div class="scorePlayer">0</div>
                        <div class="spellName">
                            <div class="playerName">Player Right</div>
                            <div class="spellContainer"></div>
                        </div>
                        <div class="iconPlayer">
                            <img class="avatar" src="../../assets/images/righticon.jpg">
                        </div>
                    </div>
                </div>
                <div id="map" class="centerLine">
                    <div id="paddleLeft" class="playerPaddle"></div>
                    <div id="paddleRight" class="playerPaddle"></div>
                </div>
            </div>
        </div>
        
        <div id="announcement">
            <h1>The game will start in</h1>
            <div id="timeBeforeStart">10</div>
            <div id="players">
                <div id="infoLeft" class="playerInfos">
                    <div class="playerData">
                        <img class="warmupImage" src="https://www.kasandbox.org/programming-images/avatars/leaf-blue.png">
                        <div class="infoUserName">PlayerName</div>
                    </div>
                    <div class="spells">
                    </div>
                </div>
                 <div id="infoRight" class="playerInfos">
                     <div class="playerData">
                        <img class="warmupImage" src="https://www.kasandbox.org/programming-images/avatars/leaf-blue.png">
                        <div class="infoUserName">PlayerName</div>
                    </div>
                    <div class="spells">
                    </div>
                </div>
            </div>
        </div>   
    `;
}