import asyncio

from ..spell import Spell
from ...utils import reverse_side


class PaddleStun(Spell):
	def __init__(self):
		super().__init__('paddleStun', 15)

	def perform_executor(self, game, player):
		target_player = game.get_player(reverse_side(player.get_side()))

		target_player.set_can_move(False)
		data_values = {"spellId": self._spell_id,
					   "playerSide": target_player.get_side(),
					   "spellAction": "executor"}
		self.send_spell_message_to_players(game, data_values)
		asyncio.create_task(self.delayed_spell_task(target_player))

	async def delayed_spell_task(self, target_player):
		await asyncio.sleep(2)
		target_player.set_can_move(True)
