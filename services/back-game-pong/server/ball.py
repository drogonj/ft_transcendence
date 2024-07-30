from .utils import get_random_number_with_decimal


class Ball:
    ball_index = 0

    def __init__(self):
        self.__ball_id = Ball.ball_index
        Ball.ball_index += 1
        self.__vx = 0.4 * get_random_number_with_decimal(-100, 100)
        self.__vy = get_random_number_with_decimal(1, 700)
        self.__top_position = 50
        self.__left_position = 50
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
        if self.__top_position <= 3 or self.__top_position >= 97:
            self.__vy = -self.__vy

    def trigger_ball_inside_goal(self):
        if self.__left_position <= 0 or self.__left_position >= 100:
            self.__vy = 0
            self.__vx = 0
            return True
        return False

    def get_ball_side(self):
        return "Left" if self.__left_position <= 50 else "Right"
