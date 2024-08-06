import json

from tornado.websocket import WebSocketClosedError


available_players = []


class Player:
	def __init__(self, socket_values):
		self.__socket = None
		self.__username = socket_values["username"]
		self.__user_id = socket_values["userId"]
		self.__score = 0
		self.__paddle_side = socket_values["side"]
		self.__top_position = 50
		self.__paddle_size = 20
		self.__move_speed = 5
		self.__spells = 0
		available_players.append(self)

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
		if step < 0 and self.__top_position <= 1:
			return False

		if step > 0 and self.__top_position >= (99 - self.__paddle_size):
			return False

		return True

	def bind_socket_to_player(self, socket):
		self.__socket = socket
		available_players.remove(self)

	def increase_score(self):
		self.__score += 1

	def has_max_score(self):
		return self.__score >= 10

	def move_paddle(self, step):
		self.__top_position += step

	def get_username(self):
		return self.__username

	def get_top_position(self):
		return self.__top_position

	def get_bot_position(self):
		return self.__top_position + 20

	def get_side(self):
		return self.__paddle_side

	def get_socket(self):
		return self.__socket


def get_player_with_user_id(user_id):
	for player in available_players:
		if player.get_user_id() == user_id:
			return player
