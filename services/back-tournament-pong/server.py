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
from tournament import Tournament, send_player_status
from websocket import WebSocketClient
import requests
from websocket import check_game_server_health
import asyncio

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backtournamentpong.settings')
django.setup()

tournaments = []
tournaments_id = 1


def get_tournament_with_id(tournament_id):
    for tournament in tournaments:
        if int(tournament.id) == int(tournament_id):
            return tournament


async def ping_all_tournaments():
    for tournament in tournaments:
        tournament.send_message_to_tournament("ping", {})


async def main_check_loop():
    while True:
        await ping_all_tournaments()
        if not await check_game_server_health():
            await gen.sleep(3)
            continue
        for tournament in tournaments:
            await tournament.trigger_tournament_stage_launch()
        await gen.sleep(1)


def is_user_already_in_tournament(user_id):
    for tournament in tournaments:
        if tournament.is_user_in_tournament(user_id):
            return True
    return False


def get_tournament_with_user_id(user_id):
    for tournament in tournaments:
        if tournament.is_user_in_tournament(user_id):
            return tournament

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
        session_id_cookie = cookies.get("sessionid")
        if not session_id_cookie:
            print("No session_id found in the cookie")
            self.close()
            return

        session_id = session_id_cookie.value

        request_data = self.get_userdata_from_session_id(session_id)
        if request_data is None:
            return
        self.user_id = int(request_data["id"])
        player = Player(self, self.user_id, request_data["username"])

        action_type = self.get_argument("action", None)
        if not action_type:
            print(f"No action type found.")
            self.close()
            return

        asyncio.create_task(send_player_status(self.user_id, 'tournament_started'))

        if action_type == "createTournament":
            global tournaments_id
            self.tournament = Tournament(player, tournaments_id)
            tournaments.append(self.tournament)
            tournaments_id += 1
        elif action_type == "joinTournament":
            self.tournament = get_tournament_with_id(self.get_argument("tournamentId", None))
            if not self.tournament:
                print(f'The user {self.user_id} try to join the tournament {self.get_argument("tournamentId", None)} but he is no longer available')
                self.write_message({"type": "error", "values": {"message": "This tournament is no longer available."}})
                return

            self.tournament = self.tournament

            if self.tournament.is_tournament_full():
                print(f'The user ({self.user_id}) {request_data["username"]} try to join the tournament {self.tournament.get_id()} but he is full')
                self.write_message({"type": "error", "values": {"message": "The target tournament is full."}})
                return

            if self.tournament.is_running:
                self.tournament.bind_player_socket(self)
            else:
                self.tournament.add_player(player)

    async def on_message(self, message):
        socket = json.loads(message)
        socket_values = socket['values']
        if socket['type'] == 'launchTournament':
            if self.tournament.is_running:
                print(f"The tournament {self.tournament.get_id()}, is already running.")
                return
            if not self.tournament.have_min_players():
                print(f"The tournament {self.tournament.get_id()}, don't have the minimum required players number.")
                await self.write_message({"type": "info", "values": {"message": "The tournament must have 4 players at least."}})
                return
            await self.tournament.launch_tournament()
        elif socket['type'] == 'endGame':
            tournament = get_tournament_with_id(socket_values["tournamentId"])
            tournament.remove_player_with_id(socket_values["looserId"])
            tournament.get_player_with_id(socket_values["winnerId"]).set_statement(0)

    def on_close(self):
        if not hasattr(self, 'user_id'):
            print("Connection with game server lost..")
            return

        if not self.tournament:
            return

        if self.tournament.is_running:
            player = self.tournament.get_player_with_id(self.user_id)
            if player is None:
                print(f"None for {self.user_id}")
                return
            if player.get_statement() == 1:
                print(f"The user {self.user_id} leave a running tournament but player object is still connected.")
                player.set_socket(None)
                return

        self.tournament.remove_player_with_id(self.user_id)
        if self.tournament.is_tournament_done():
            print(f"The tournament with id {self.tournament.get_id()} is done and removed.")
            tournaments.remove(self.tournament)

    def get_userdata_from_session_id(self, session_id):
        request_response = requests.post("http://user-management:8000/api/user/get_session_user/",
                                         json={"sessionId": session_id})
        if request_response.status_code != 200:
            print(f"An error occured with the session_id: {session_id}. Error code: {request_response.status_code}")
            self.close()
            return None

        return request_response.json()

    def check_status(self):
        request_response = requests.get(f'http://user-management:8000/api/user/get_user/{self.user_id}/')
        if request_response.status_code != 200:
            print(f"Error when try to get status for user: {self.user_id}. Error: {request_response.status_code} {request_response.text}")
            self.write_message({"type": "error", "values": {"message": "Error when try to check your status"}})
            return False
        request_json = request_response.json()
        if request_json["status"] != "online":
            return False
        return True


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