from .utils import get_random_number_with_decimal


class Ball:
    ball_index = 0

    def __init__(self):
        self.__ball_id = Ball.ball_index
        Ball.ball_index += 1
        self.__vx = get_random_number_with_decimal(0.3, 1)
        self.__vy = get_random_number_with_decimal(0.3, 0.7)
        print(f"{self.__vx}, {self.__vy}")
        self.__top_position = 48.5
        self.__left_position = 49.2
        self.__active_spell = None

    def dumps_ball_for_socket(self):
        return {
            "ballId": self.__ball_id,
            "topPosition": str(self.__top_position) + "%",
            "leftPosition": str(self.__left_position) + "%",
        }

    def move_ball(self):
        self.__top_position -= self.__vy
        self.__left_position -= self.__vx

    def trigger_ball_inside_border(self):
        if self.__top_position <= 0 or self.__top_position >= 97:
            self.__vy = -self.__vy

    def trigger_ball_inside_goal(self):
        if self.get_left_position() <= 0 or self.get_right_position() >= 100:
            print("goal")
            return True
        return False

    def trigger_ball_inside_player(self, players):
        for player in players:
            if self.get_top_position() <= player.get_bot_position():
                if self.get_bot_position() >= player.get_top_position():
                    if self.get_left_position() < 2 or self.get_left_position() > 98:
                        return True
        return False

    def calcul_ball_traj(self, player):
        print("ca")

    def get_top_position(self):
        return self.__top_position

    def get_bot_position(self):
        return self.__top_position + 3

    def get_left_position(self):
        return self.__left_position

    def get_right_position(self):
        return self.__left_position + 1.5

    def get_ball_side(self):
        return "Left" if self.__left_position <= 50 else "Right"
