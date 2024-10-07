import asyncio
import aiohttp

from .ball import Ball
from .utils import reverse_side
from .redis_communication import send_game_data_to_redis, store_game_data
from .spell.spell_registry import SpellRegistry
from .player import Player
from websocket import check_tournament_server_health, get_game_server

games = []

lock = asyncio.Lock()

async def send_player_status(id, state):
	url = 'http://user-management:8000/backend/user_statement/'
	data = {"user_id": id, "state": state}

	async with lock:
		try:
			async with aiohttp.ClientSession() as session:
				async with session.post(url, json=data) as response:
					if response.status == 200:
						return await response.json()
					else:
						response.raise_for_status()
		except Exception as e:
			print(f"Failed to send player status: {e}")
			return
		await asyncio.sleep(0.1)

class Game:
	def __init__(self, socket_values):
		self.__players = [Player(socket_values["userId1"], "Left"), Player(socket_values["userId2"], "Right")]
		SpellRegistry.set_spells_to_players(self.__players)
		self.__balls = [Ball()]
		self.__is_game_end = False
		self.__game_end_reason = None
		self.__tournament_id = 0
		#tournamentID received will start at 1
		if socket_values.get("tournamentId"):
			self.__tournament_id = int(socket_values["tournamentId"])
		games.append(self)
		print(f"A new game is created with playerIds: {self.__players[0].get_user_id()} and {self.__players[1].get_user_id()}")

	def launch_game(self):
		self.send_message_to_game("renderPage", {"url": "/game-online"})

		socket_values = {}
		player_left = self.get_player("Left")
		player_right = self.get_player("Right")

		socket_values["ballId"] = self.__balls[0].get_id()
		socket_values["playerLeft"] = player_left.dumps_player_for_socket()
		socket_values["playerRight"] = player_right.dumps_player_for_socket()

		socket_values["clientSide"] = "Left"
		player_left.send_message_to_player("launchGame", socket_values)
		if self.__tournament_id < 1:
			asyncio.create_task(send_player_status(player_left.get_user_id(), 'remote_game_started'))
			asyncio.create_task(send_player_status(player_right.get_user_id(), 'remote_game_started'))

		socket_values["clientSide"] = "Right"
		player_right.send_message_to_player("launchGame", socket_values)

		asyncio.create_task(self.launch_loop())

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
					target_player.statistics.touched_balls += 1
					ball.calcul_ball_traj(target_player)
					if ball.have_active_spell():
						ball.get_active_spell().on_hit(ball, self)
				ball.move_ball()
				balls_to_send.append(ball.dumps_ball_for_socket())
			self.send_message_to_game("moveBall", {"targetBalls": balls_to_send})
			balls_to_send.clear()
			await asyncio.sleep(0.014)
		await self.game_end()

	def send_message_to_game(self, data_type, data_values):
		for player in self.__players:
			player.send_message_to_player(data_type, data_values)

	async def launch_loop(self):
		warmup = 10.0
		while warmup > 0:
			await asyncio.sleep(0.1)
			warmup -= 0.1
			if self.__is_game_end:
				await self.game_end()
				return
		asyncio.create_task(self.main_loop())
		asyncio.create_task(self.launch_max_time())

	def move_player(self, socket_values):
		player_side = socket_values["clientSide"]
		player = self.get_player(player_side)
		step = -0.5 if socket_values["direction"] == "moveUp" else 0.5
		if not player.player_can_move(step):
			return
		player.move_paddle(step)
		self.send_message_to_game("movePlayer", {"targetPlayer": player_side, "topPosition": f"{player.get_top_position()}%"})

	def launch_spell(self, socket_values):
		player = self.get_player(socket_values["playerSide"])
		spell = player.get_spell_number(int(socket_values["spellNumber"]))
		spell.executor(player, self)

	def remove_player_with_client(self, client):
		for player in self.__players:
			if player.get_socket() == client:
				self.__players.remove(player)

	def disconnect_player_with_socket(self, client):
		for player in self.__players:
			if player.get_socket() == client:
				player.statistics.score = -42
				player.set_socket(None)

	def mark_point(self, ball):
		player_have_mark = self.get_player(reverse_side(ball.get_ball_side()))
		player_take_goal = self.get_player(ball.get_ball_side())

		player_have_mark.increase_score()
		player_have_mark.statistics.increase_goals_in_row()
		player_take_goal.statistics.reset_goals_in_row()
		player_take_goal.statistics.reset_time_without_taking_goals()
		socket_values = {"targetPlayer": player_have_mark.get_side()}
		socket_values.update(ball.dumps_ball_for_socket())
		if ball.have_active_spell():
			ball.get_active_spell().destructor(ball)
		self.delete_ball(ball)
		self.send_message_to_game("displayScore", socket_values)
		if self.have_player_with_max_score():
			self.set_game_state(True, 'max_score_reached')
		if len(self.__balls) == 0:
			self.create_ball()

	def delete_ball(self, ball):
		self.__balls.remove(ball)

	def create_ball(self):
		new_ball = Ball()
		self.__balls.append(new_ball)
		self.send_message_to_game("createBall", new_ball.dumps_ball_for_socket())

	def create_ball_by_copy(self, ball_to_copy):
		new_ball = ball_to_copy.deep_copy()
		new_ball.set_vy(-ball_to_copy.get_vy())
		new_ball.move_ball()
		self.__balls.append(new_ball)
		self.send_message_to_game("createBall", new_ball.dumps_ball_for_socket())

	async def launch_max_time(self):
		max_time = 120
		while max_time >= 0:
			await asyncio.sleep(1)
			for player in self.__players:
				player.statistics.increase_time_without_taking_goals()
			max_time -= 1
		self.__game_end_reason = 'max_time_reached'
		self.__is_game_end = True

	async def game_end(self):
		store_game_data(self.__players, self.__game_end_reason)
		send_game_data_to_redis()

		data_values = {}
		for player in self.__players:
			player.statistics.reset_goals_in_row()
			player.statistics.reset_time_without_taking_goals()
			data_values[player.get_side()] = player.statistics.get_statistics_as_list()

		if self.__tournament_id < 1:
			asyncio.create_task(send_player_status(self.__players[0].get_user_id(), 'remote_game_ended'))
			asyncio.create_task(send_player_status(self.__players[1].get_user_id(), 'remote_game_ended'))

		if self.__tournament_id >= 1 and await check_tournament_server_health():
			await get_game_server().send("endGame", {"tournamentId": self.__tournament_id, "winnerId": self.get_winner().get_user_id(), "looserId": self.get_looser().get_user_id()})
			self.get_looser().send_message_to_player("endGame", data_values)
			self.get_winner().send_message_to_player("endGame", {"tournamentId": self.__tournament_id})
			return

		self.send_message_to_game("endGame", data_values)

	def trigger_game_launch(self):
		if self.__players[0].is_socket_bind() and self.__players[1].is_socket_bind():
			self.launch_game()

	def get_player(self, side):
		return self.__players[0] if self.__players[0].get_side() == side else self.__players[1]

	def get_players(self):
		return self.__players

	def get_balls_in_direction(self, direction):
		balls = []
		for ball in self.__balls:
			if ball.get_ball_direction() == direction:
				balls.append(ball)
		return balls

	def set_game_state(self, state, reason=None):
		self.__is_game_end = state
		if reason is not None:
			self.__game_end_reason = reason

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
			if player.statistics.score >= 10:
				return True
		return False

	def get_winner(self):
		return self.__players[0] if self.__players[0].statistics.score > self.__players[1].statistics.score else self.__players[1]

	def get_looser(self):
		return self.__players[0] if self.__players[0].statistics.score < self.__players[1].statistics.score else self.__players[1]


def get_game_with_client(client):
	for game in games:
		if game.is_game_containing_client(client):
			return game


def disconnect_handle(client):
	game = get_game_with_client(client)

	if not game:
		return

	game.disconnect_player_with_socket(client)
	game.set_game_state(True, f'{client.user_id}_disconnected')

	if not game.is_game_containing_players():
		print("A game is delete because no player left.")
		games.remove(game)


def bind_socket_to_player(socket, user_id):
	for game in games:
		for player in game.get_players():
			if player.get_user_id() == int(user_id):
				player.set_socket(socket)
				game.trigger_game_launch()
				return True
	return False
