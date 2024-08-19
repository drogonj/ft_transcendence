import asyncio

from ..spell import Spell
from ...utils import reverse_side


class PaddleSize(Spell):
    def __init__(self):
        super().__init__('paddleSize', 17)

    def perform_executor(self, game, player):
        target_player = game.get_player(reverse_side(player.get_side()))

        target_player.set_paddle_size(10)
        data_values = {"spellId": self._spell_id,
                       "playerSide": player.get_side(),
                       "spellAction": "executor",
                       "playerTarget": target_player.get_side()}
        self.send_spell_message_to_players(game, data_values)
        asyncio.create_task(self.delayed_spell_task(target_player))

    async def delayed_spell_task(self, target_player):
        while target_player.get_paddle_size() < 20:
            await asyncio.sleep(1)
            target_player.set_paddle_size(target_player.get_paddle_size() + 2)
