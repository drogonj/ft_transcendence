import random
from spells import BallPush


class SpellRegistry:
    spells_list = [BallPush]

    @classmethod
    def set_spells_to_players(cls, players):
        shuffled_list = random.sample(cls.spells_list, len(cls.spells_list))
        players[0].set_spells(shuffled_list[:4])
        players[1].set_spells(shuffled_list[4:])
