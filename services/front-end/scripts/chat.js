
export async function openChatWindow(friendId, friendName) {
	const width = 400;
	const height = 600;
	const left = (screen.width / 2) - (width / 2);
	const top = (screen.height / 2) - (height / 2);

	const chatWindow = window.open('', 'ChatWindow', `width=${width},height=${height},top=${top},left=${left}`);

	chatWindow.document.write(`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Chat with ${friendName}</title>
			<style>
				body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
				#chat-messages { height: 80%; overflow-y: scroll; border-bottom: 1px solid #ccc; padding: 10px; }
				#chat-input-container { display: flex; padding: 10px; }
				#chat-input { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
				#send-chat-message { padding: 10px 20px; margin-left: 10px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
				#send-chat-message:hover { background-color: #45a049; }
			</style>
		</head>
		<body>
			<div id="chat-messages">Chat with ${friendName} (ID: ${friendId})</div>
			<div id="chat-input-container">
				<input id="chat-input" type="text" placeholder="Type a message...">
				<button id="send-chat-message">Send</button>
			</div>
			<script>
				const socket = new WebSocket('wss://' + window.location.host + '/ws/chat/${friendId}/');

				socket.onmessage = function(e) {
					const data = JSON.parse(e.data);
					const message = data.message;
					const userId = data.user_id;
					const chatMessages = document.getElementById('chat-messages');
					chatMessages.innerHTML += '<p><strong>' + userId + ':</strong> ' + message + '</p>';
				};

				document.getElementById('send-chat-message').onclick = function() {
					const inputField = document.getElementById('chat-input');
					const message = inputField.value;
					if (message) {
						socket.send(JSON.stringify({
							'message': message,
							'user_id': 'current_user_id' // replace with current user ID
						}));
						inputField.value = '';
					}
				};

				document.getElementById('chat-input').addEventListener('keypress', function(e) {
					if (e.key === 'Enter') {
						document.getElementById('send-chat-message').click();
					}
				});
			</script>
		</body>
		</html>
	`);

	chatWindow.document.close();
}


// Code a tester sur https://codepen.io/

// HTML
/* <div class="chat-menu-container">
    <button id="chat-menu-button" class="chat-menu-button">Chat</button>
    <div id="chat-menu" class="chat-menu">
        <div class="chat-menu-header">
        </div>
        <div id="chat-messages" class="chat-messages">
            <!-- Messages will go here -->
        </div>
        <div id="chat-input-container" class="chat-input-container">
            <input id="chat-input" type="text" placeholder="Type a message...">
            <button id="send-chat-message" class="send-chat-message">Send</button>
        </div>
    </div>
</div> */


// CSS
// #chat-input-container {
// 	display: flex;
// 	padding: 10px;
// 	background-color: #fff;
// 	border-top: 1px solid #ccc;
// 	box-sizing: border-box;
//   }
  
//   #chat-input {
// 	flex: 1;
// 	padding: 10px;
// 	border: 1px solid #ccc;
// 	border-radius: 4px;
// 	margin-right: 10px;
// 	box-sizing: border-box;
//   }
  
//   .send-chat-message {
// 	background-color: #ff0266;
// 	color: white;
// 	border: none;
// 	padding: 10px 20px;
// 	border-radius: 4px;
// 	cursor: pointer;
// 	transition: background-color 0.1s ease-in;
//   }
  
//   .send-chat-message:hover {
// 	background-color: #c70652;
//   }
  
//   .chat-menu-container {
// 	position: fixed;
// 	left: 0;
// 	bottom: 0;
// 	display: flex;
// 	flex-direction: row;
// 	align-items: flex-start;
//   }
  
//   .chat-menu-button {
// 	background-color: #ff0266;
// 	color: white;
// 	border: none;
// 	margin: 0;
// 	padding: 12px;
// 	width: 75px;
// 	height: 50px;
// 	border-radius: 5px;
// 	cursor: pointer;
// 	text-align: center;
// 	box-sizing: border-box;
// 	transition: ease-in 0.1s;
//   }
  
//   .chat-menu-button:hover {
// 	background-color: #c70652;
//   }
  
//   .chat-menu {
// 	list-style: none;
// 	padding: 0;
// 	position: relative;
// 	left: 0;
// 	bottom: 0;
// 	background-color: #c5c8de;
// 	box-shadow: 0 0 10px rgba(129, 66, 199, 0.69);
// 	border-radius: 0 5px 5px 0;
// 	overflow: hidden;
// 	max-width: 0;
// 	transition: max-width 0.3s ease-out;
// 	width: 500px;
// 	box-sizing: border-box;
// 	height: 500px;
// 	display: flex;
// 	flex-direction: column;
//   }
  
//   .chat-messages {
// 	flex: 1;
// 	padding: 10px;
// 	overflow-y: auto;
//   }
  
//   .chat-menu-container.active .chat-menu {
// 	max-width: 500px;
//   }
  
  

// JavaScript
// document.getElementById('chat-menu-button').addEventListener('click', function() {
//     let container = document.querySelector('.chat-menu-container');
    
//     if (container.classList.contains('active')) {
//         container.classList.remove('active');
//     } else {
//         container.classList.add('active');
//     }
// });