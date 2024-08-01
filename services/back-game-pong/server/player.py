import json

from tornado.websocket import WebSocketClosedError

from .utils import get_random_number_between


class Player:
	def __init__(self, ws, side, username):
		self.__socket = ws
		self.__username = username
		self.__score = 0
		self.__paddle_side = side
		self.__top_position = 50
		self.__paddle_size = 20
		self.__move_speed = 5
		self.__spells = 0

	def send_message_to_player(self, data_type, data_values):
		data = {'type': data_type, 'values': data_values}
		try:
			self.__socket.write_message(json.dumps(data))
		except WebSocketClosedError:
			print("Client is already disconnected.")

	def dumps_player_for_socket(self):
		return {
			"moveSpeed": self.__move_speed,
			"paddleTopPosition": str(self.__top_position) + "%",
			"playerSpells": ["ballClone", "ballPush", "ballFreeze", "paddleSize"]
		}

	def kill_connection(self):
		self.__socket.close()

	def player_can_move(self, step):
		if step == -1 and self.__top_position <= 1:
			return False

		if step == 1 and self.__top_position >= (99 - self.__paddle_size):
			return False

		return True

	def increase_score(self):
		self.__score += 1

	def has_max_score(self):
		return self.__score >= 10

	def move_paddle(self, step):
		self.__top_position += step

	def get_top_position(self):
		return self.__top_position

	def get_bot_position(self):
		return self.__top_position + 20

	def get_side(self):
		return self.__paddle_side

	def get_socket(self):
		return self.__socket


def create_players(clients):
	new_players = []
	side = "Left"
	for client in clients:
		new_players.append(Player(client, side, None))
		side = "Right"
	return new_players
