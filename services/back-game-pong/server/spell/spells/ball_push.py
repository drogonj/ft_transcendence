from ..spell import Spell


class BallPush(Spell):
    def __init__(self):
        super().__init__('ballPush', 5)

    def perform_executor(self):
        print("ballpush executor")

    def on_hit(self):
        print("ballpush hit")

    def destructor(self):
        print("ballpush destructor")
