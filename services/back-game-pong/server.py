import json
import os
import django
from django.core.wsgi import get_wsgi_application
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import FallbackHandler, Application
from tornado.wsgi import WSGIContainer
from tornado.websocket import WebSocketHandler
from server.game import Game, get_game_with_client, remove_player_from_client
from server.player import Player


# Server will send websocket as json with the followed possible key
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
        clients.append(self)
        print("[+] A new client is connected to the server.")
        if len(clients) == 2:
            Game(0, clients)

    def on_message(self, message):
        socket = json.loads(message)
        socket_values = socket['values']
        print(socket['type'])
        print(socket_values)
        if socket["type"] == "movePlayer":
            get_game_with_client(self).move_player(socket_values)
        elif socket["type"] == "createPlayer":
            Player(self, None, socket_values['username'])

    def on_close(self):
        print("[-] A client leave the server")
        remove_player_from_client(self)
        clients.remove(self)


# WSGI container for Django
django_app = WSGIContainer(get_wsgi_application())

tornado_app = Application([
    (r"/api/back", EchoWebSocket),  # API handler path
    (r".*", FallbackHandler, dict(fallback=django_app)),  # Fallback to Django
])

if __name__ == "__main__":
    server = HTTPServer(tornado_app)
    server.listen(2605)
    print("Starting Tornado server on http://localhost:2605")
    IOLoop.current().start()