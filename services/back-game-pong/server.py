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


class GameServerWebSocket(WebSocketHandler):
    def check_origin(self, origin):
        return True  # Allow all origins

    def open(self):
        print("[+] A new connection is established to game server.")

    def on_message(self, message):
        socket = json.loads(message)
        socket_values = socket['values']
        if socket["type"] == "movePlayer":
            get_game_with_client(self).move_player(socket_values)
        elif socket["type"] == "launchSpell":
            get_game_with_client(self).launch_spell(socket_values)
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
    (r"/ws/back", GameServerWebSocket),  # API handler path
    (r".*", FallbackHandler, dict(fallback=django_app)),  # Fallback to Django
])

if __name__ == "__main__":
    server = HTTPServer(tornado_app)
    server.listen(2605)
    print("Starting Tornado server on port 2605")
    IOLoop.current().start()

# [+] A new connection is established to game server.
# 2024-08-28T14:57:06.820139015Z Uncaught exception GET /ws/back (192.168.144.3)
# 2024-08-28T14:57:06.820149571Z HTTPServerRequest(protocol='http', host='localhost', method='GET', uri='/ws/back', version='HTTP/1.1', remote_ip='192.168.144.3')
# 2024-08-28T14:57:06.820150822Z [-] A client leave the server
# 2024-08-28T14:57:06.820152786Z Traceback (most recent call last):
# 2024-08-28T14:57:06.820165621Z   File "/usr/local/lib/python3.10/site-packages/tornado/websocket.py", line 631, in _run_callback
# 2024-08-28T14:57:06.820169196Z     result = callback(*args, **kwargs)
# 2024-08-28T14:57:06.820172078Z   File "//server.py", line 45, in on_message
# 2024-08-28T14:57:06.820175398Z     player.bind_socket_to_player(self)
# 2024-08-28T14:57:06.820178403Z AttributeError: 'NoneType' object has no attribute 'bind_socket_to_player'
# 2024-08-28T14:57:06.821167649Z Uncaught exception GET /ws/back (192.168.144.3)
# 2024-08-28T14:57:06.821174292Z HTTPServerRequest(protocol='http', host='localhost', method='GET', uri='/ws/back', version='HTTP/1.1', remote_ip='192.168.144.3')
# 2024-08-28T14:57:06.821177834Z Traceback (most recent call last):
# 2024-08-28T14:57:06.821179566Z   File "/usr/local/lib/python3.10/site-packages/tornado/web.py", line 1790, in _execute
# 2024-08-28T14:57:06.821181377Z     result = await result
# 2024-08-28T14:57:06.821183112Z   File "/usr/local/lib/python3.10/site-packages/tornado/websocket.py", line 273, in get
# 2024-08-28T14:57:06.821184885Z     await self.ws_connection.accept_connection(self)
# 2024-08-28T14:57:06.821186573Z   File "/usr/local/lib/python3.10/site-packages/tornado/websocket.py", line 863, in accept_connection
# 2024-08-28T14:57:06.821188251Z     await self._accept_connection(handler)
# 2024-08-28T14:57:06.821189805Z   File "/usr/local/lib/python3.10/site-packages/tornado/websocket.py", line 946, in _accept_connection
# 2024-08-28T14:57:06.821191456Z     await self._receive_frame_loop()
# 2024-08-28T14:57:06.821193000Z   File "/usr/local/lib/python3.10/site-packages/tornado/websocket.py", line 1105, in _receive_frame_loop
# 2024-08-28T14:57:06.821194921Z     self.handler.on_ws_connection_close(self.close_code, self.close_reason)
# 2024-08-28T14:57:06.821202114Z   File "/usr/local/lib/python3.10/site-packages/tornado/websocket.py", line 571, in on_ws_connection_close
# 2024-08-28T14:57:06.821203673Z     self.on_connection_close()
# 2024-08-28T14:57:06.821204830Z   File "/usr/local/lib/python3.10/site-packages/tornado/websocket.py", line 563, in on_connection_close
# 2024-08-28T14:57:06.821206131Z     self.on_close()
# 2024-08-28T14:57:06.821207256Z   File "//server.py", line 52, in on_close
# 2024-08-28T14:57:06.821208430Z     disconnect_handle(self)
# 2024-08-28T14:57:06.821209579Z   File "/server/game.py", line 206, in disconnect_handle
# 2024-08-28T14:57:06.821210820Z     game.disconnect_player_with_socket(client)
# 2024-08-28T14:57:06.821212039Z AttributeError: 'NoneType' object has no attribute 'disconnect_player_with_socket'