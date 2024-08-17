from ..spell import Spell


class BallClone(Spell):
    def __init__(self):
        super().__init__('ballClone', 5)

    def perform_executor(self):
        print("ballpush executor")
