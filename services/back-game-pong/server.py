import json
import os
import django
from django.core.wsgi import get_wsgi_application
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import FallbackHandler, Application
from tornado.wsgi import WSGIContainer
from tornado.websocket import WebSocketHandler
from server.game import Game, get_game_with_client, bind_player_to_game, disconnect_handle
from server.player import Player, get_player_with_user_id


# Server will send websocket as json with the followed possible keys
# type : Type of data: such as moveBall, movePlayer, createPlayer ...
# values: The values, need to be sent according to the type, send as dictionary

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backgame.settings')
django.setup()

clients = []


class EchoWebSocket(WebSocketHandler):
    def check_origin(self, origin):
        return True  # Allow all origins

    def open(self):
        print("[+] A new connection is established to game server.")

    def on_message(self, message):
        socket = json.loads(message)
        socket_values = socket['values']
        if socket["type"] == "movePlayer":
            get_game_with_client(self).move_player(socket_values)
        elif socket["type"] == "createPlayer":
            Player(socket_values)
        elif socket["type"] == "createGame":
            Game(0, socket_values)
        elif socket["type"] == "bindSocket":
            player = get_player_with_user_id(socket["values"]["userId"])
            player.bind_socket_to_player(self)
            player.set_username(socket["values"]["username"])
            bind_player_to_game(player)
            print(f"The player {player.get_username()} is connected and bind.")

    def on_close(self):
        print("[-] A client leave the server")
        disconnect_handle(self)
        clients.remove(self)


# WSGI container for Django
django_app = WSGIContainer(get_wsgi_application())

tornado_app = Application([
    (r"/ws/back", EchoWebSocket),  # API handler path
    (r".*", FallbackHandler, dict(fallback=django_app)),  # Fallback to Django
])

if __name__ == "__main__":
    server = HTTPServer(tornado_app)
    server.listen(2605)
    print("Starting Tornado server on port 2605")
    IOLoop.current().start()
