import json
import os

import django
import tornado
from django.core.wsgi import get_wsgi_application
from tornado import gen
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import FallbackHandler, Application
from tornado.wsgi import WSGIContainer
from tornado.websocket import WebSocketHandler
from player import Player
from tournament import Tournament
from websocket import WebSocketClient, get_game_server
from websockets.exceptions import (
    ConnectionClosedError,
    InvalidURI,
    InvalidHandshake,
    WebSocketException
)
import random
import requests

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backtournamentpong.settings')
django.setup()

users_in_queue = []
tournaments = []
tournaments_id = 1


def get_tournament_with_id(tournament_id):
    for tournament in tournaments:
        if int(tournament.id) == int(tournament_id):
            return tournament


def get_tournament_from_player_socket(socket):
    for tournament in tournaments:
        tournament = tournament.contain_player_with_socket(socket)
        if tournament is not None:
            return tournament


async def ping_all_tournaments():
    for tournament in tournaments:
        tournament.send_message_to_tournament("ping", {})


async def bind_to_game_server():
    print("Try connecting to the game server..")
    try:
        await get_game_server().connect()
    except (OSError, InvalidURI, InvalidHandshake, ConnectionClosedError, WebSocketException) as e:
        print(f"Failed to connect: {e}")


async def check_game_server_health():
    if not get_game_server().is_connected():
        await bind_to_game_server()
        return False
    return True


async def send_users_to_server():
    selected_users = get_two_users()
    await get_game_server().send("createGame", {"userId1": selected_users[0].get_user_id(),
                                                "userId2": selected_users[1].get_user_id()})

    side = "Left"
    for user in selected_users:
        await get_game_server().send("createPlayer", {"userId": user.get_user_id(), "side": side})
        side = "Right"

    for user in selected_users:
        users_in_queue.remove(user)
        user.send_message_to_user("connectTo", {"server": "gameServer"})


async def main_check_loop():
    while True:
        await ping_all_tournaments()
        if not await check_game_server_health():
            await gen.sleep(3)
            continue
        #if len(users_in_queue) > 1:
         #   print("2 players founds, sending to game server..")
         #   await send_users_to_server()
        await gen.sleep(1)


def get_two_users():
    return random.sample(users_in_queue, 2)


def is_user_already_in_tournament(user_id):
    for tournament in tournaments:
        if tournament.is_user_in_tournament(user_id):
            return True
    return False

class TournamentWebSocket(WebSocketHandler):
    def __init__(self, *args, **kwargs):
        # General class initialization, no connection-specific data here
        super(TournamentWebSocket, self).__init__(*args, **kwargs)
        self.player = None
        self.tournament = None

    def check_origin(self, origin):
        return True  # Allow all origins

    def open(self):
        cookies = self.request.cookies

        if not cookies:
            print(f'[+] Server {self.request.headers.get("server")} is bind to server Tournament')
            return

        session_id = cookies.get("sessionid").value

        request_data = self.get_userdata_from_session_id(session_id)
        if request_data is None:
            return

        self.user_id = int(request_data["id"])
        #todo remove check
        if is_user_already_in_tournament(self.user_id):
            print(f"The user {self.user_id} is already in a tournament.")
            self.write_message({"type": "error", "values": {"message": "You are already in a Tournament"}})
            return
        player = Player(self, self.user_id, request_data["username"])

        try:
            action_type = cookies.get("type").value
        except AttributeError:
            print(f"No action type found.")
            self.close()
            return

        if action_type == "createTournament":
            global tournaments_id
            self.tournament = Tournament(player, tournaments_id)
            tournaments.append(self.tournament)
            tournaments_id += 1
        elif action_type == "joinTournament":
            self.tournament = get_tournament_with_id(cookies.get("tournamentId").value)
            if not self.tournament:
                print(f'The user {self.user_id} try to join the tournament {self.tournament.get_id()} bit its no longer available')
                self.close()
                return

            self.tournament = self.tournament

            if self.tournament.is_tournament_full():
                print(f'The user ({self.user_id}) {request_data["username"]} try to join the tournament {self.tournament.get_id()} but its full')
                self.close()
                return

            if self.tournament.is_running:
                self.tournament.bind_player_socket(self)
            else:
                self.tournament.add_player(player)
        response = requests.post('http://user-management:8000/backend/user_statement/', json={"user_id": self.user_id, "state": "tournament_started"})

    async def on_message(self, message):
        socket = json.loads(message)
        socket_values = socket['values']
        if socket['type'] == 'launchTournament':
            tournament = get_tournament_from_player_socket(self)
            if tournament.is_running:
                print(f"The tournament {tournament.get_id()}, is already running.")
                return
            await tournament.launch_tournament()
        elif socket['type'] == 'endGame':
            tournament = get_tournament_with_id(socket_values["tournamentId"])
            tournament.remove_player_with_id(socket_values["looserId"])
            #tournament = get_tournament_with_id(socket_values["tournamentId"])


    def on_close(self):
        #self.tournament.remove_player_with_socket(self)
        #if not self.tournament.is_running and self.tournament.is_tournament_done():
        #    print(f"The tournament with id {self.tournament.get_id()} is done and removed.")
        #    tournaments.remove(self.tournament)
        response = requests.post('http://user-management:8000/backend/user_statement/', json={"user_id": self.user_id, "state": "tournament_ended"})

    def get_userdata_from_session_id(self, session_id):
        request_response = requests.post("http://user-management:8000/api/user/get_session_user/",
                                         json={"sessionId": session_id})
        if request_response.status_code != 200:
            print(f"An error occured with the session_id: {session_id}. Error code: {request_response.status_code}")
            self.close()
            return None

        return request_response.json()


class TournamentRequestHandler(WebSocketHandler):
    def check_origin(self, origin):
        return True  # Allow all origins

    def get(self):
        tournaments_to_send = []
        for tournament in tournaments:
            if not tournament.is_running:
                tournaments_to_send.append(tournament.dump_tournament())
        self.write(json.dumps(tournaments_to_send))


# WSGI container for Django
django_app = WSGIContainer(get_wsgi_application())

tornado_app = Application([
    (r"/ws/tournament", TournamentWebSocket),  # API handler path
    (r"/api/tournament/get_tournaments/", TournamentRequestHandler),
    (r".*", FallbackHandler, dict(fallback=django_app)),  # Fallback to Django
])


if __name__ == "__main__":
    server = HTTPServer(tornado_app)
    server.listen(2610)
    print("Starting Tornado server on port 2610")
    WebSocketClient("ws://back-game:2605/ws/back")
    IOLoop.current().spawn_callback(main_check_loop)
    IOLoop.current().start()