import asyncio
from .player import Player, create_players


game = []


def launch_game():
		game[0].get_player("Left").send_message_to_client("renderPage", {"pageName": "pong-game-online.html"})
		game[0].get_player("Left").send_message_to_client("createPlayer", game[0].get_player("Left").dumps_player_for_socket())
		game[0].get_player("Left").send_message_to_client("launchGame", {})


class Game:
	def __init__(self, game_id, clients, balls):
		self.__game_id = game_id
		self.__players = create_players(clients)
		self.__balls = balls
		self.__game_time = 180
		time_loop = asyncio.get_event_loop()
		#self.launch_time()
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
		self.__players[0].move_paddle(-1)
		self.__players[0].send_message_to_client("movePlayer", {"topPosition": f"{self.__players[0].get_top_position()}%"})

	def get_player(self, side):
		return self.__players[0] if side == "Left" else self.__players[1]


def is_game_end():
	return game[0].__players[0].has_max_score() or game[0].__players[1].has_max_score()


def getp():
	return game[0]

