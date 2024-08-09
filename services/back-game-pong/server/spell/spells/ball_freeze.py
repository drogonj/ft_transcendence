from ..spell import Spell


class BallFreeze(Spell):
    def __init__(self):
        super().__init__('ballFreeze', 5)