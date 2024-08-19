from ..spell import Spell


class BallClone(Spell):
    def __init__(self):
        super().__init__('ballClone', 5)

    def perform_executor(self, game, player):
        target_balls = game.get_balls_in_direction(player.get_side())

        ball_ids = []
        for ball in target_balls:
            ball.set_active_spell(self)
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
        game.create_ball_by_copy(ball)

    def destructor(self, ball, game):
        ball.remove_active_spell()
