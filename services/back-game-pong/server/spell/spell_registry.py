import random
from .spells import BallPush, PaddleStun, BallFreeze, BallSlayer, BallClone, BallInvisible, PaddleSize


class SpellRegistry:
    spells_list = [BallPush(), BallSlayer(), BallFreeze(), BallClone(), BallInvisible(), PaddleSize()]

    @classmethod
    def set_spells_to_players(cls, players):
        shuffled_list = random.sample(cls.spells_list, len(cls.spells_list))
        spells_to_add = shuffled_list[:3]
        spells_to_add.append(PaddleStun())
        players[0].set_spells(spells_to_add)
        spells_to_add = shuffled_list[3:]
        spells_to_add.append(PaddleStun())
        players[1].set_spells(spells_to_add)
