from ..spell import Spell


class BallFreeze(Spell):
    def __init__(self):
        super().__init__('ballFreeze', 5)

    def perform_executor(self, game, player):
        target_balls = game.get_balls_in_direction(player.get_side())

        ball_ids = []
        for ball in target_balls:
            ball.set_active_spell(self)
            ball.set_vx(ball.get_vx() / 2)
            ball.set_vy(ball.get_vy() / 2)
            ball_ids.append(ball.get_id())
        data_values = {"spellId": self._spell_id,
                      "playerSide": player.get_side(),
                      "spellAction": "executor",
                      "ballIds": ball_ids}
        self.send_spell_message_to_players(game, data_values)

    def on_hit(self, ball, game):
        data_values = {"spellId": self._spell_id,
                      "spellAction": "onHit",
                      "ballIds": ball.get_id()}
        self.send_spell_message_to_players(game, data_values)
        ball.remove_active_spell()

    def destructor(self, ball, game):
        ball.set_vx(ball.get_vx() * 2)
        ball.set_vy(ball.get_vy() * 2)
        ball.remove_active_spell()
