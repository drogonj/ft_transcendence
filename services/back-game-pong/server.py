import json
import os
import django
from django.core.wsgi import get_wsgi_application
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import FallbackHandler, Application
from tornado.wsgi import WSGIContainer
from tornado.websocket import WebSocketHandler
from server.game import Game, get_game_with_id


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
        target_game = get_game_with_id(0)
        if socket["type"] == "movePlayer":
            target_game.move_player(socket['values'])

    def on_close(self):
        print("[-] A client leave the server")
        get_game_with_id(0).set_game_state(True)
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