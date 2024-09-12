import json

class Tournament:
    def __init__(self, host_player, tournament_id):
        self.id = tournament_id
        self.host_player = host_player
        self.players = []
        self.add_player(host_player)

    def add_player(self, player):
        self.players.append(player)
        self.send_message_to_tournament("refreshLobby", self.dump_players_in_tournament())

    def remove_player(self, player):
        self.players.remove(player)
        if player.get_player_id() == self.host_player.get_player_id():
            if len(self.players):
                self.host_player = self.players[0]
                print(f'The new host for the tournament {self.get_id()} is ({self.host_player.get_player_id()}) {self.host_player.get_username()}')
        self.send_message_to_tournament("refreshLobby", self.dump_players_in_tournament())

    def remove_player_with_socket(self, socket):
        for player in self.players:
            if player.get_socket() == socket:
                print(f"The player {player.get_username()} leave the tournament with id {self.get_id()}")
                self.remove_player(player)
                break

    def send_message_to_tournament(self, data_type, data_values):
        for player in self.players:
            player.send_message_to_player(data_type, data_values)

    def is_tournament_done(self):
        if len(self.players) <= 0:
            return True
        return False

    def is_tournament_full(self):
        return len(self.players) >= 10

    def dump_tournament(self):
        return {"tournamentId": self.id, "hostUsername": self.host_player.get_username(), "playersNumber": len(self.players)}

    def dump_players_in_tournament(self):
        players = []
        for player in self.players:
            players.append(player.dumps_player())
        return json.dumps(players)

    def is_user_in_tournament(self, user_id):
        for player in self.players:
            if player.get_player_id() == user_id:
                return True
        return False

    def contain_player_with_socket(self, socket):
        for player in self.players:
            if player.get_socket() == socket:
                return self

    def get_id(self):
        return self.id
