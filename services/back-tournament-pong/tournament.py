class Tournament:
    def __init__(self, host_player, tournament_id):
        self.id = tournament_id
        self.host_player = host_player
        self.players = []