from ..spell import Spell


class BallInvisible(Spell):
    def __init__(self):
        super().__init__('ballInvisible', 5)