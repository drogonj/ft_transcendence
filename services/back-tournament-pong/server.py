import json
import os

import django
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

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backtournamentpong.settings')
django.setup()

users_in_queue = []
tournaments = []


def get_tournament_with_id(tournament_id):
    for tournament in tournaments:
        if tournament.id == tournament_id:
            return tournament


async def ping_users():
    for user in users_in_queue:
        user.send_message_to_user("ping", {})


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
        if not await check_game_server_health():
            await gen.sleep(3)
            continue
        await ping_users()
        if random.randrange(0, 15) == 0:
            print("Looking for two users..")
        if len(users_in_queue) > 1:
            print("2 players founds, sending to game server..")
            await send_users_to_server()
        await gen.sleep(1)


def get_two_users():
    return random.sample(users_in_queue, 2)


class TournamentWebSocket(WebSocketHandler):
    def check_origin(self, origin):
        return True  # Allow all origins

    def open(self):
        print("[+] A new client is connected to the tournament server.")

    def on_message(self, message):
        socket = json.loads(message)
        socket_values = socket['values']
        if socket['type'] == 'launchTournament':
            print("launchTournament")
        elif socket['type'] == 'createUser':
            player = Player(self, socket_values)
            users_in_queue.append(player)
            print(f"User with id {player.get_player_id()} is bind to a client in the tournament server")
            if socket_values['host']:
                tournaments.append(Tournament(player, socket_values["tournamentId"]))
            else:
                print("bindtotournament")

    def on_close(self):
        print(f"[-] A user leave the tournament server.")


# WSGI container for Django
django_app = WSGIContainer(get_wsgi_application())

tornado_app = Application([
    (r"/ws/tournament", TournamentWebSocket),  # API handler path
    (r".*", FallbackHandler, dict(fallback=django_app)),  # Fallback to Django
])


if __name__ == "__main__":
    server = HTTPServer(tornado_app)
    server.listen(2610)
    print("Starting Tornado server on port 2610")
    WebSocketClient("ws://back-game:2605/ws/back")
    IOLoop.current().spawn_callback(main_check_loop)
    IOLoop.current().start()