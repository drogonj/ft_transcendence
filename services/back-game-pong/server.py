import json
import os
import django
import requests
from django.core.wsgi import get_wsgi_application
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import FallbackHandler, Application
from tornado.wsgi import WSGIContainer
from tornado.websocket import WebSocketHandler
from server.game import Game, get_game_with_client, disconnect_handle, bind_socket_to_player


# Server will send websocket as json with the followed possible keys
# type : Type of data: such as moveBall, movePlayer, createPlayer ...
# values: The values, need to be sent according to the type, send as dictionary

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backgame.settings')
django.setup()

clients = []


class GameServerWebSocket(WebSocketHandler):
    def check_origin(self, origin):
        return True  # Allow all origins

    def open(self):
        cookies = self.request.cookies
        if not cookies:
            print(f'[+] Server {self.request.headers.get("server")} is bind to server Game')
            return

        session_id = cookies.get("sessionid").value
        request_response = requests.post("http://user-management:8000/api/user/get_session_user/",
                                         json={"sessionId": session_id})
        if request_response.status_code != 200:
            print(f"An error occured with the session_id: {session_id}. Error code: {request_response.status_code}")
            self.close()
            return

        request_data = request_response.json()
        if not bind_socket_to_player(self, request_data["id"]):
            print(f'An error occured with the id: {request_data["id"]}. No player found')
            self.close()
            return

        print(f'[+] The user ({request_data["id"]}) {request_data["username"]} is connected to the game server.')

    def on_message(self, message):
        socket = json.loads(message)
        socket_values = socket['values']
        if socket["type"] == "movePlayer":
            get_game_with_client(self).move_player(socket_values)
        elif socket["type"] == "launchSpell":
            get_game_with_client(self).launch_spell(socket_values)
        elif socket["type"] == "createGame":
            Game(0, socket_values)

    def on_close(self):
        print("[-] A client leave the server")
        disconnect_handle(self)
        clients.remove(self)


# WSGI container for Django
django_app = WSGIContainer(get_wsgi_application())

tornado_app = Application([
    (r"/ws/back", GameServerWebSocket),  # API handler path
    (r".*", FallbackHandler, dict(fallback=django_app)),  # Fallback to Django
])

if __name__ == "__main__":
    server = HTTPServer(tornado_app)
    server.listen(2605)
    print("Starting Tornado server on port 2605")
    IOLoop.current().start()
