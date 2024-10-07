import asyncio
import json
import random
import asyncio
import aiohttp

from websocket import get_game_server

lock = asyncio.Lock()

async def send_player_status(id, state):
    url = 'http://user-management:8000/backend/user_statement/'
    data = {"user_id": id, "state": state}

    async with lock:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        response.raise_for_status()
        except Exception as e:
            print(f"Failed to send player status: {e}")
            return
        await asyncio.sleep(0.1)

async def send_player_win_tournament(id):
    url = 'http://user-management:8000/backend/add_won_tournament/'
    data = {"user_id": id}
    async with lock:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        response.raise_for_status()
        except Exception as e:
            print(f"Failed to send player win tournament: {e}")
            return
        await asyncio.sleep(0.1)

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
        removed_players = []
        if len(players) % 2:
            removed_players.append(players.pop())
        await self.launch_tournament_warmup(players, removed_players)
        for i in range(0, len(players), 2):
            await get_game_server().send("createGame", {"userId1": players[i].get_player_id(),
                                                        "userId2": players[i+1].get_player_id(),
                                                        "tournamentId": self.get_id()})
            print(f"For the tournament {self.get_id()} new stage launch for {players[i].get_player_id()} vs {players[i+1].get_player_id()}")
        for player in players:
            player.send_message_to_player("connectTo", {"server": "gameServer"})
            player.set_statement(1)
        for removed_player in removed_players:
            removed_player.send_message_to_player("refreshLobby", self.dump_players_in_tournament())

    async def launch_tournament_warmup(self, players, removed_players):
        print(f"New warmup start for the tournement {self.get_id()}")
        for i in range(0, len(players), 2):
            players[i].send_message_to_player("info", {"message": "The game will start in 5 seconds"})
            players[i+1].send_message_to_player("info", {"message": "The game will start in 5 seconds"})
        await asyncio.sleep(5)

        players_without_leaver = []
        for i in range(0, len(players), 2):
            if players[i].get_socket() is None or players[i+1].get_socket() is None:
                remind_player = players[i] if players[i].get_socket() is not None else players[i+1]
                remind_player.send_message_to_player("info", {"message": "Your opponent has left the tournament. Please wait for the next stage."})
                removed_players.append(remind_player)
                print(f"For the stage of tournament {self.get_id()} a player left on warmup.")
                continue

            players_without_leaver.append(players[i])
            players_without_leaver.append(players[i+1])
        players[:] = players_without_leaver

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
                asyncio.create_task(send_player_status(user_id, 'tournament_ended'))
                print(f"The player ({player.get_player_id()}) {player.get_username()} leave the tournament with id {self.get_id()}")
                player.set_socket(None)
                self.remove_player(player)
                break

    async def trigger_tournament_stage_launch(self):
        if not self.is_running:
            return
        for player in self.players:
            if player.get_socket() is None:
                return
        if len(self.players) == 1 and self.players[0].get_statement() == 0:
            self.is_running = False
            self.send_message_to_tournament("endTournament", {})
            asyncio.create_task(send_player_win_tournament(self.players[0].get_player_id()))
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
        return len(self.players) >= 20

    def have_min_players(self):
        return len(self.players) >= 4

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
