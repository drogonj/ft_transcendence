import os
import django
from django.core.wsgi import get_wsgi_application
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import FallbackHandler, RequestHandler, Application
from tornado.wsgi import WSGIContainer
from tornado import gen
from tornado.websocket import WebSocketHandler
import json
from server.player import Player


# Server will send websocket as json with the followed possible key
# type : Will make easier to the client to know what server want (moveBall, check, createPlayer, renderPage, message)
# targetHtmlElement : If a htmlElement is implicated, must be indicated here
# values: The value who need to be set according, send as dictionnary
# styles :
# boolean : For all authorizations check, for example if player press the up key, the server will check if
#     the player can do that then answer through this key.#

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backgame.settings')
django.setup()

clients = []

class EchoWebSocket(WebSocketHandler):
    def check_origin(self, origin):
        return True  # Allow all origins

    def open(self):
        clients.append(Player(self))
        data = {}
        data['type'] = 'renderPage'
        data['values'] = {"pageName": "pong-game-online.html"}
        clients[0].send_message_to_client(json.dumps(data))
        data.clear()
        data['type'] = 'createPlayer'
        data['values'] = {"paddleHtml": "paddleLeft", "paddleHeader": "headerLeft", "moveSpeed": "5", "playerTopPosition": "20%", "paddleSize": "20%"}
        clients[0].send_message_to_client(json.dumps(data))

    def on_message(self, message):
        data = {}
        data['type'] = 'message'
        data['values'] = {"message": "You said: " + message}
        self.write_message(data)
        print("Tornado: msg send to client")

    def on_close(self):
        print("WebSocket closed")
        clients.remove(self)

# Define a simple Tornado handler
i = 0
class HelloHandler(RequestHandler):
    async def get(self):
        global i
        i += 1
        print(f"Handling request {i}")
        if i == 1:
            await gen.sleep(5)  # Asynchronous sleep for 5 seconds
        self.write(f"Hello from Tornado! {i}")

# WSGI container for Django
django_app = WSGIContainer(get_wsgi_application())

# Tornado application
tornado_app = Application([
    (r"/api/back", EchoWebSocket),  # API handler path
    (r"/hello-tornado", HelloHandler),  # Tornado-specific handler
    (r".*", FallbackHandler, dict(fallback=django_app)),  # Fallback to Django
])

if __name__ == "__main__":
    server = HTTPServer(tornado_app)
    server.listen(2605)
    print("Starting Tornado server on http://localhost:2605")
    IOLoop.current().start()