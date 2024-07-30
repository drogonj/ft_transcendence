import asyncio
from .player import create_players


games = []


def launch_game():
		games[0].get_player("Left").send_message_to_client("renderPage", {"pageName": "pong-game-online.html"})
		socket_values = games[0].get_player("Left").dumps_player_for_socket()
		socket_values["gameId"] = games[0].get_id()
		socket_values["clientSide"] = "Left"
		games[0].get_player("Left").send_message_to_client("launchGame", socket_values)


class Game:
	def __init__(self, game_id, clients, balls):
		self.__game_id = game_id
		self.__players = create_players(clients)
		self.__balls = balls
		self.__game_time = 120
		time_loop = asyncio.get_event_loop()
		#self.launch_time()
		games.append(self)
		launch_game()

	def send_message_to_game(self, data_type, data_values):
		for player in self.__players:
			player.send_message_to_client(data_type, data_values)

	async def launch_time(self):
		while self.__game_time > 0:
			self.__game_time -= 1
			await asyncio.sleep(1)
		self.game_end()

	def game_end(self):
		print("game end")

	def move_player(self, socket_values, player_side):
		player = self.get_player(player_side)
		step = -1 if socket_values["direction"] == "moveUp" else 1
		player.move_paddle(step)
		self.send_message_to_game("movePlayer", {"targetPlayer": player_side, "topPosition": f"{player.get_top_position()}%"})

	def get_player(self, side):
		return self.__players[0] if side == "Left" else self.__players[1]

	def get_id(self):
		return self.__game_id


def is_game_end():
	return games[0].__players[0].has_max_score() or games[0].__players[1].has_max_score()


def get_game_with_id(game_id):
	for game in games:
		if game.get_id() == game_id:
			return game

