import json

from tornado.websocket import WebSocketClosedError
from .statistics import Statistics


class Player:
	def __init__(self, user_id, side):
		self.__socket = None
		self.__user_id = int(user_id)
		self.__paddle_side = side
		self.__top_position = 50
		self.__paddle_size = 20
		self.__can_move = True
		self.__spells = []
		self.statistics = Statistics()

	def send_message_to_player(self, data_type, data_values):
		data = {'type': data_type, 'values': data_values}
		try:
			self.__socket.write_message(json.dumps(data))
		except (WebSocketClosedError, AttributeError):
			print("Message can't be send: Client is disconnected.")

	def dumps_player_for_socket(self):
		spells_id = []
		for spell in self.__spells:
			spells_id.append(spell.get_spell_id())

		return {
			"userId": self.__user_id,
			"paddleSide": self.__paddle_side,
			"paddleTopPosition": str(self.__top_position) + "%",
			"playerSpells": spells_id
		}

	def kill_connection(self):
		self.__socket.close()

	def player_can_move(self, step):
		if step < 0 and self.__top_position <= 1:
			return False

		if step > 0 and self.__top_position >= (99 - self.__paddle_size):
			return False

		return True

	def increase_score(self):
		self.statistics.score += 1

	def has_max_score(self):
		return self.statistics.score >= 10

	def move_paddle(self, step):
		if self.__can_move:
			self.__top_position += step

	def get_user_id(self):
		return self.__user_id

	def get_top_position(self):
		return self.__top_position

	def get_bot_position(self):
		return self.__top_position + self.__paddle_size

	def get_side(self):
		return self.__paddle_side

	def get_socket(self):
		return self.__socket

	def get_spell_with_id(self, spell_id):
		for spell in self.__spells:
			if spell.get_spell_id() == spell_id:
				return spell
		return None

	def get_spell_number(self, number):
		return self.__spells[number]

	def get_paddle_size(self):
		return self.__paddle_size

	def set_socket(self, socket):
		self.__socket = socket

	def set_spells(self, spells):
		self.__spells = spells

	def set_can_move(self, value):
		self.__can_move = value

	def set_paddle_size(self, value):
		self.__paddle_size = value

	def is_socket_bind(self):
		return self.__socket is not None
