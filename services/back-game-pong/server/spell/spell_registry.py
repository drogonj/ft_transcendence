import random
from .spells import BallPush, PaddleStun


class SpellRegistry:
    spells_list = [BallPush(), PaddleStun()]

    @classmethod
    def set_spells_to_players(cls, players):
        shuffled_list = random.sample(cls.spells_list, len(cls.spells_list))
        players[0].set_spells([shuffled_list[0]])
        players[1].set_spells([shuffled_list[1]])
        #players[0].set_spells(shuffled_list[:4])
        #players[1].set_spells(shuffled_list[4:])
