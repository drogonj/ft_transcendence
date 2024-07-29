import json
from .utils import get_random_number_between


class Player:
	def __init__(self, ws, side):
		self.__socket = ws
		self.__score = 0
		self.__paddle_side = side
		self.__top_position = get_random_number_between(0, 50)
		self.__paddle_size = 20
		self.__move_speed = 5
		self.__spells = 0

	def send_message_to_client(self, data_type, data_values):
		data = {'type': data_type, 'values': data_values}
		self.__socket.write_message(json.dumps(data))

	def dumps_player_for_socket(self):
		return {
				"moveSpeed": self.__move_speed,
				"paddleTopPosition": str(self.__top_position) + "%",
				"playerSpells": ["ballClone", "ballPush", "ballFreeze", "paddleSize"]
		}

	def mark_point(self):
		self.__score += 1
		self.send_message_to_client("displayScore", {"score": self.__score})

	def has_max_score(self):
		return self.__score >= 10

	def move_paddle(self, step):
		self.__top_position += step

	def get_top_position(self):
		return self.__top_position

	def player_can_move(self, step):
		if step == -1 and self.__top_position <= 1:
			return False

		if step == 1 and self.__top_position >= (99 - self.__paddle_size):
			return False

		return True


def create_players(clients):
	new_players = []
	side = "Left"
	for client in clients:
		new_players.append(Player(client, side))
		side = "Right"
	return new_players
