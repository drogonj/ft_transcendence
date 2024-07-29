import asyncio
from .player import create_players
from .ball import Ball


games = []


def launch_game():
	socket_values = {}
	games[0].send_message_to_game("renderPage", {"pageName": "pong-game-online.html"})
	socket_values["gameId"] = games[0].get_id()
	socket_values["ballId"] = 0

	player = games[0].get_player("Left")
	socket_values.update(player.dumps_player_for_socket())
	socket_values["clientSide"] = "Left"
	player.send_message_to_client("launchGame", socket_values)

	#player = games[0].get_player("Right")
	#socket_values = player.dumps_player_for_socket()
	#socket_values["clientSide"] = "Right"
	#player.send_message_to_client("launchGame", socket_values)
	#print(socket_values)

	asyncio.create_task(games[0].main_loop())


class Game:
	def __init__(self, game_id, clients):
		self.__game_id = game_id
		self.__players = create_players(clients)
		self.__balls = [Ball()]
		asyncio.create_task(self.launch_max_time())
		games.append(self)
		launch_game()

	def send_message_to_game(self, data_type, data_values):
		for player in self.__players:
			player.send_message_to_client(data_type, data_values)

	async def launch_max_time(self):
		await asyncio.sleep(120)
		self.game_end()

	def game_end(self):
		self.send_message_to_game("renderPage", {"pageName": "menu-end.html"})

	def move_player(self, socket_values):
		player_side = socket_values["clientSide"]
		player = self.get_player(player_side)
		step = -1 if socket_values["direction"] == "moveUp" else 1
		if not player.player_can_move(step):
			return
		player.move_paddle(step)
		self.send_message_to_game("movePlayer", {"targetPlayer": player_side, "topPosition": f"{player.get_top_position()}%"})

	def get_player(self, side):
		return self.__players[0] if side == "Left" else self.__players[1]

	def get_id(self):
		return self.__game_id

	async def main_loop(self):
		balls_to_send = []
		while True:
			for ball in self.__balls:
				ball.trigger_ball_inside_border()
				ball.move_ball()
				balls_to_send.append(ball.dumps_ball_for_socket())
			self.send_message_to_game("moveBall", {"targetBalls": balls_to_send})
			balls_to_send.clear()
			await asyncio.sleep(0.03)


def is_game_end():
	return games[0].__players[0].has_max_score() or games[0].__players[1].has_max_score()


def get_game_with_id(game_id):
	for game in games:
		if game.get_id() == game_id:
			return game

