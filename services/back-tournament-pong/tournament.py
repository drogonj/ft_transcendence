import json
import random

from websocket import get_game_server


class Tournament:
    def __init__(self, host_player, tournament_id):
        self.id = tournament_id
        self.players = []
        self.add_player(host_player)
        host_player.set_is_host(True)
        self.is_running = False

    async def launch_tournament(self):
        self.is_running = True
        # Once the tournament is launch, we no longer need a host.
        for player in self.players:
            if player.get_is_host:
                player.set_is_host(False)
        print(f"The tournament {self.get_id()} is launch..")

    async def launch_stage(self):
        players = self.players.copy()
        random.shuffle(players)
        removed_player = None
        if len(players) % 2:
            removed_player = players.pop()
        for i in range(0, len(players), 2):
            await get_game_server().send("createGame", {"userId1": players[i].get_player_id(),
                                                        "userId2": players[i+1].get_player_id(),
                                                        "tournamentId": self.get_id()})
            print(f"For the tournament {self.get_id()} new stage launch for {players[i].get_player_id()} vs {players[i+1].get_player_id()}")
        for player in players:
            player.send_message_to_player("connectTo", {"server": "gameServer"})
            player.set_statement(1)
        if removed_player:
            removed_player.send_message_to_player("refreshLobby", self.dump_players_in_tournament())

    def add_player(self, player):
        self.players.append(player)
        print(f'The player ({player.get_player_id()}) {player.get_username()} join the tournament {self.get_id()}')
        self.send_message_to_tournament("refreshLobby", self.dump_players_in_tournament())

    def bind_player_socket(self, socket):
        for player in self.players:
            if player.get_player_id() == int(socket.user_id):
                player.set_socket(socket)
                print(f'The player ({player.get_player_id()}) {player.get_username()} is bind to the tournament {self.get_id()}')
                self.send_message_to_tournament("refreshLobby", self.dump_players_in_tournament())
                return
        print(f"Error, impossible to rebind the player {socket.user_id}")

    def remove_player(self, player):
        self.players.remove(player)
        if not self.is_running and player.get_is_host():
            if len(self.players):
                self.players[0].set_is_host(True)
                print(f'The new host for the tournament {self.get_id()} is ({self.players[0].get_player_id()}) {self.players[0].get_username()}')
        self.send_message_to_tournament("refreshLobby", self.dump_players_in_tournament())

    def remove_player_with_id(self, user_id):
        for player in self.players:
            if player.get_player_id() == int(user_id):
                print(f"The player ({player.get_player_id()}) {player.get_username()} leave the tournament with id {self.get_id()}")
                self.remove_player(player)
                break

    async def trigger_tournament_stage_launch(self):
        if not self.is_running:
            return
        for player in self.players:
            if player.get_socket() is None:
                return
        if len(self.players) == 1:
            self.is_running = False
            self.send_message_to_tournament("endTournament", {})
            return
        await self.launch_stage()

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
        return {"tournamentId": self.id, "hostUsername": self.get_host_player().get_username(), "playersNumber": len(self.players)}

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

    def contain_player_with_id(self, player_id):
        for player in self.players:
            if player.get_player_id() == player_id:
                return True
        return False

    def get_id(self):
        return self.id

    def get_host_player(self):
        for player in self.players:
            if player.get_is_host():
                return player

    def get_player_with_id(self, player_id):
        for player in self.players:
            if player.get_player_id() == player_id:
                return player
