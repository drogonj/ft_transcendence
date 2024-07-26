import json


class Player:
	def __init__(self, ws, side):
		self.__socket = ws
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