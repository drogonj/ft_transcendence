import asyncio
from .player import create_players
from .ball import Ball
from .utils import reverse_side


games = []


def launch_game():
	socket_values = {}
	games[0].send_message_to_game("renderPage", {"pageName": "pong-game-online.html"})
	socket_values["gameId"] = games[0].get_id()
	socket_values["ballId"] = 0

	player = games[0].get_player("Left")
	socket_values.update(player.dumps_player_for_socket())
	socket_values["clientSide"] = "Left"
	player.send_message_to_player("launchGame", socket_values)

	socket_values.clear()
	socket_values["gameId"] = games[0].get_id()
	socket_values["ballId"] = 0

	player = games[0].get_player("Right")
	socket_values.update(player.dumps_player_for_socket())
	socket_values["clientSide"] = "Right"
	player.send_message_to_player("launchGame", socket_values)
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

	async def main_loop(self):
		balls_to_send = []
		while True:
			for ball in self.__balls:
				if ball.trigger_ball_inside_goal():
					self.mark_point(ball)
					continue
				ball.trigger_ball_inside_border()
				if ball.trigger_ball_inside_player(self.__players):
					continue
				ball.move_ball()
				balls_to_send.append(ball.dumps_ball_for_socket())
			self.send_message_to_game("moveBall", {"targetBalls": balls_to_send})
			balls_to_send.clear()
			await asyncio.sleep(0.04)

	def send_message_to_game(self, data_type, data_values):
		for player in self.__players:
			player.send_message_to_player(data_type, data_values)

	def move_player(self, socket_values):
		player_side = socket_values["clientSide"]
		player = self.get_player(player_side)
		step = -1 if socket_values["direction"] == "moveUp" else 1
		if not player.player_can_move(step):
			return
		player.move_paddle(step)
		self.send_message_to_game("movePlayer", {"targetPlayer": player_side, "topPosition": f"{player.get_top_position()}%"})

	def mark_point(self, ball):
		side = reverse_side(ball.get_ball_side())

		self.get_player(side).increase_score()
		socket_values = {"targetPlayer": side}
		socket_values.update(ball.dumps_ball_for_socket())
		self.delete_ball(ball)
		self.send_message_to_game("displayScore", socket_values)
		self.create_ball()

	def delete_ball(self, ball):
		self.__balls.remove(ball)

	def create_ball(self):
		new_ball = Ball()
		self.__balls.append(new_ball)
		self.send_message_to_game("createBall", new_ball.dumps_ball_for_socket())

	async def launch_max_time(self):
		await asyncio.sleep(120)
		self.game_end()

	def is_game_end(self):
		return self.__players[0].has_max_score() or self.__players[1].has_max_score()

	def game_end(self):
		self.send_message_to_game("renderPage", {"pageName": "menu-end.html"})

	def get_player(self, side):
		return self.__players[0] if side == "Left" else self.__players[1]

	def get_id(self):
		return self.__game_id


def get_game_with_id(game_id):
	for game in games:
		if game.get_id() == game_id:
			return game

