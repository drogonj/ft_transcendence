import asyncio
from .ball import Ball
from .utils import reverse_side
from .redis_communication import send_to_redis, create_data_to_send


games = []


class Game:
	def __init__(self, game_id, socket_values):
		self.__game_id = game_id
		self.__players = []
		self.__user_ids = [socket_values["userId1"], socket_values["userId2"]]
		self.__balls = [Ball()]
		self.__is_game_end = False
		games.append(self)

	def launch_game(self):
		self.send_message_to_game("renderPage", {"url": "/game-online"})

		socket_values = {}
		socket_values["gameId"] = self.get_id()
		socket_values["ballId"] = self.__balls[0].get_id()

		player = self.get_player("Left")
		socket_values.update(player.dumps_player_for_socket())
		socket_values["clientSide"] = "Left"
		player.send_message_to_player("launchGame", socket_values)

		player = self.get_player("Right")
		socket_values.update(player.dumps_player_for_socket())
		socket_values["clientSide"] = "Right"
		player.send_message_to_player("launchGame", socket_values)

		asyncio.create_task(self.main_loop())
		asyncio.create_task(self.launch_max_time())

	async def main_loop(self):
		balls_to_send = []
		while not self.__is_game_end:
			for ball in self.__balls:
				if ball.trigger_ball_inside_goal():
					self.mark_point(ball)
					continue
				elif ball.trigger_ball_inside_border():
					ball.calcul_ball_border_traj()
				elif ball.trigger_ball_inside_player(self.__players):
					target_player = self.get_player("Left") if ball.get_ball_side() == "Left" else self.get_player("Right")
					ball.calcul_ball_traj(target_player)
				ball.move_ball()
				balls_to_send.append(ball.dumps_ball_for_socket())
			self.send_message_to_game("moveBall", {"targetBalls": balls_to_send})
			balls_to_send.clear()
			await asyncio.sleep(0.02)
		self.game_end()

	def send_message_to_game(self, data_type, data_values):
		for player in self.__players:
			player.send_message_to_player(data_type, data_values)

	def move_player(self, socket_values):
		player_side = socket_values["clientSide"]
		player = self.get_player(player_side)
		step = -0.5 if socket_values["direction"] == "moveUp" else 0.5
		if not player.player_can_move(step):
			return
		player.move_paddle(step)
		self.send_message_to_game("movePlayer", {"targetPlayer": player_side, "topPosition": f"{player.get_top_position()}%"})

	def remove_player_with_client(self, client):
		for player in self.__players:
			if player.get_socket() == client:
				self.__players.remove(player)

	def disconnect_player_with_socket(self, client):
		for player in self.__players:
			if player.get_socket() == client:
				player.set_socket(None)

	def mark_point(self, ball):
		side = reverse_side(ball.get_ball_side())

		self.get_player(side).increase_score()
		socket_values = {"targetPlayer": side}
		socket_values.update(ball.dumps_ball_for_socket())
		self.delete_ball(ball)
		self.send_message_to_game("displayScore", socket_values)
		if self.have_player_with_max_score():
			self.set_game_state(True)
		self.create_ball()

	def delete_ball(self, ball):
		self.__balls.remove(ball)

	def create_ball(self):
		new_ball = Ball()
		self.__balls.append(new_ball)
		self.send_message_to_game("createBall", new_ball.dumps_ball_for_socket())

	async def launch_max_time(self):
		await asyncio.sleep(120)
		self.__is_game_end = True

	def game_end(self):
		send_to_redis(create_data_to_send(self.__players))
		self.send_message_to_game("renderPage", {"url": "/game-end"})
		for player in self.__players:
			if player.get_socket():
				player.kill_connection()

	def trigger_game_launch(self):
		if len(self.__players) == 2:
			self.launch_game()

	def add_player_to_game(self, player):
		self.__players.append(player)
		self.trigger_game_launch()

	def get_user_ids(self):
		return self.__user_ids

	def get_player(self, side):
		return self.__players[0] if self.__players[0].get_side() == side else self.__players[1]

	def get_id(self):
		return self.__game_id

	def set_game_state(self, state):
		self.__is_game_end = state

	def is_game_containing_client(self, client):
		for player in self.__players:
			if player.get_socket() == client:
				return True
		return False

	def is_game_containing_players(self):
		for player in self.__players:
			if player.get_socket() is not None:
				return True
		return False

	def have_player_with_max_score(self):
		for player in self.__players:
			if player.get_score() >= 10:
				return True
		return False


def get_game_with_id(game_id):
	for game in games:
		if game.get_id() == game_id:
			return game


def get_game_with_client(client):
	for game in games:
		if game.is_game_containing_client(client):
			return game


def disconnect_handle(client):
	game = get_game_with_client(client)

	game.disconnect_player_with_socket(client)
	game.set_game_state(True)

	if not game.is_game_containing_players():
		games.remove(game)


def bind_player_to_game(player):
	for game in games:
		for user_id in game.get_user_ids():
			if user_id == player.get_user_id():
				game.add_player_to_game(player)
				return
