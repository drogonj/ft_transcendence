class Tournament:
    def __init__(self, host_player, tournament_id):
        self.id = tournament_id
        self.host_player = host_player
        self.players = [host_player]

    def add_player(self, player):
        self.players.append(player)

    def send_message_to_tournament(self, data_type, data_values):
        for player in self.players:
            player.send_message_to_player(data_type, data_values)

    def dump_tournament(self):
        return {"hostPlayerId": self.host_player.get_player_id(), "playersNumber": len(self.players)}

    def is_user_in_tournament(self, user_id):
        for player in self.players:
            if player.get_player_id() == user_id:
                return True
        return False
