import asyncio

from ..spell import Spell


class BallSlayer(Spell):
    def __init__(self):
        super().__init__('ballSlayer', 10)

    def perform_executor(self, game, player):
        target_balls = game.get_balls_in_direction(player.get_side())

        ball_ids = []
        for ball in target_balls:
            ball_ids.append(ball.get_id())
            game.delete_ball(ball)
        data_values = {"spellId": self._spell_id,
                      "playerSide": player.get_side(),
                      "spellAction": "executor",
                      "ballIds": ball_ids}
        self.send_spell_message_to_players(game, data_values)
        asyncio.create_task(self.delayed_spell_task(game))

    async def delayed_spell_task(self, game):
        await asyncio.sleep(1)
        game.create_ball()
