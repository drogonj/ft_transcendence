
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
				const socket = new WebSocket('ws://' + window.location.host + '/ws/chat/${friendId}/');

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
