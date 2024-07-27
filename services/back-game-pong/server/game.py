import asyncio
from .player import Player, create_players


game = []


class Game:
	def __init__(self, game_id, clients, balls):
		self.__game_id = game_id
		self.__players = create_players(clients)
		self.__balls = balls
		self.__game_time = 180
		self.launch_time()
		game.append(self)
		launch_game()

	async def launch_time(self):
		while self.__game_time > 0:
			self.__game_time -= 1
			await asyncio.sleep(1)
		self.game_end()

	def game_end(self):
		print("game end")

	def move_player(self, player_id):
		self.__players[0].__top_position -= 1
		self.__players[0].send_message_to_client("movePlayer", {"topPosition": self.__players[0].__top_position})


def launch_game():
	for player in game[0].__players:
		player.send_message_to_client("renderPage", {"pageName": "pong-game-online.html"})
		player.send_message_to_client("createPlayer", player.dumps_player_for_socket())
		player.send_message_to_client("launchGame", {})


def is_game_end():
	return game[0].__players[0].has_max_score() or game[0].__players[1].has_max_score()


def getp():
	return game[0]

