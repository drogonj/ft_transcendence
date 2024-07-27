import asyncio
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
	launch_time()


def game_end():
	print("game end")


def is_game_end():
	return players[0].has_max_score() or players[1].has_max_score()


async def launch_time():
	max_time = 180
	while max_time > 0:
		max_time -= 1
		await asyncio.sleep(1)
	game_end()
