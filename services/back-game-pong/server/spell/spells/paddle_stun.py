from ..spell import Spell


class PaddleStun(Spell):
	def __init__(self):
		super().__init__('paddleStun', 15)

	def perform_executor(self, game, player):
		print("paddlestun executor")