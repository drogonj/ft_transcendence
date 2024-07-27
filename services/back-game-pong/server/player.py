import json
from .game import is_game_end, game_end


class Player:
	def __init__(self, ws, side):
		self.__socket = ws
		self.__score = 0
		self.__paddleSide = side
		self.__top_position = 20
		self.__paddle_size = 20
		self.__move_speed = 5
		self.__spells = 0

	def send_message_to_client(self, data_type, data_values):
		data = {'type': data_type, 'values': data_values}
		self.__socket.write_message(json.dumps(data))

	def dumps_player_for_socket(self):
		return {
				"paddleHtml": "paddle" + self.__paddleSide,
				"paddleHeader": "header" + self.__paddleSide,
				"moveSpeed": self.__move_speed,
				"playerTopPosition": str(self.__top_position) + "%",
				"playerSpells": ["ballClone", "ballPush", "ballFreeze", "paddleSize"]
		}

	def mark_point(self):
		self.__score += 1
		self.send_message_to_client("displayScore", {"score": self.__score})
		if is_game_end():
			game_end()

	def has_max_score(self):
		return self.__score >= 10
