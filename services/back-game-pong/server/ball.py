balls = []


class Ball:
    def __init__(self):
        self.__ball_size = None
        self.__ball_id = len(balls)
        #self.__ball_vx = 0.4 * getRandomNumberBetweenOne()
        #self.__ball_vy = getRandomNumberWithDecimal(0.1, 0.7)
        self.__ball_size = 1.5
        self.__ball_top_position = 50
        self.__ball_left_position = 50
        self.__ball_active_spell = None

