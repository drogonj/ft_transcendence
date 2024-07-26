from .player import Player


players = []


def setup_game(clients):
	side = "Left"
	for client in clients:
		players.append(Player(client, side))
		side = "Right"
	launch_game()


def launch_game():
	for player in players:
		player.send_message_to_client("renderPage", {"pageName": "pong-game-online.html"})
		player.send_message_to_client("createPlayer", player.dumps_player_for_socket())
		player.send_message_to_client("launchGame", {})
		player.send_message_to_client("displayScore", {"score": "1"})
