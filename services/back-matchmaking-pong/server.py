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
from user import User
import asyncio
import random

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backmatchmaking.settings')
django.setup()

users_in_queue = []


async def main_check_loop():
    while True:
        print("Looking for two users..")
        if len(users_in_queue) > 1:
            selected_users = get_two_users()
            create_players(selected_users)
            for user in selected_users:
                user.kill_connection()
                users_in_queue.remove(user)
        await gen.sleep(1)


def create_players(users_list):
    side = "Left"
    for user in users_list:
        user.send_message_to_user("createPlayer", {"username": "exemple", "side": side})
        side = "Right"


def get_two_users():
    selected_user = []
    while not len(selected_user) == 2:
        user = random.choice(users_in_queue)
        selected_user.append(user)
    return selected_user


class EchoWebSocket(WebSocketHandler):
    def check_origin(self, origin):
        return True  # Allow all origins

    def open(self):
        print("[+] A new client is connected to the matchmaking server.")

    def on_message(self, message):
        socket = json.loads(message)
        socket_values = socket['values']
        users_in_queue.append(User(self, socket_values))

    def on_close(self):
        user = self.get_user_from_socket()
        print(f"[-] {user.get_username()} leave the matchmaking server")
        users_in_queue.remove(user)

    def get_user_from_socket(self):
        for user in users_in_queue:
            if user.get_socket() == self:
                return user
        print("User not found.")


# WSGI container for Django
django_app = WSGIContainer(get_wsgi_application())

tornado_app = Application([
    (r"/api/matchmaking", EchoWebSocket),  # API handler path
    (r".*", FallbackHandler, dict(fallback=django_app)),  # Fallback to Django
])


if __name__ == "__main__":
    server = HTTPServer(tornado_app)
    server.listen(2607)
    print("Starting Tornado server on http://localhost:2607")
    IOLoop.current().spawn_callback(main_check_loop)
    IOLoop.current().start()
