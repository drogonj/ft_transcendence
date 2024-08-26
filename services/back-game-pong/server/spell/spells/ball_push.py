from ..spell import Spell


class BallPush(Spell):
    def __init__(self):
        super().__init__('ballPush', 5)

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
        if self._statement > 0:
            self.destructor(ball)
            return

        ball.set_vx(ball.get_vx() * 2)
        ball.set_vy(ball.get_vy() * 2)
        data_values = {"spellId": self._spell_id,
                      "spellAction": "onHit",
                      "ballIds": ball.get_id()}
        self.send_spell_message_to_players(game, data_values)
        self._statement += 1

    def destructor(self, ball):
        ball.set_vx(ball.get_vx() / 2)
        ball.set_vy(ball.get_vy() / 2)
        ball.remove_active_spell()
        self._statement = 0
