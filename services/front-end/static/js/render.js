import { navigateTo, app } from './contentLoader.js';
import { handleLogin, handleSignup, handleLogout, handleUserUpdate } from './auth.js';

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
                           <input type="text" id="email" name="email" required>
                           <i>Email</i>
                          </div>
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
        app.innerHTML = `
                        <h1>Home Page</h1>
                        <p>Logged in as ${data.current_user}</p>
                        <img src="/api/user/get_avatar/" alt="avatar"/>
                        <button id="logout-button">Logout</button>
                        <a href="#" id="update-user-info">User update info</a>
                    `;
        document.getElementById('logout-button').addEventListener('click', handleLogout);
        document.getElementById('update-user-info').addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo('/update/');
        });
    } else {
        navigateTo('/login');
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
