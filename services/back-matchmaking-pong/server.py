import json
import os

import django
import requests
from django.core.wsgi import get_wsgi_application
from tornado import gen
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import FallbackHandler, Application
from tornado.wsgi import WSGIContainer
from tornado.websocket import WebSocketHandler
from user import User
from websocket import WebSocketClient, get_game_server
from websockets.exceptions import (
    ConnectionClosedError,
    InvalidURI,
    InvalidHandshake,
    WebSocketException
)
import random

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backmatchmaking.settings')
django.setup()

users_in_queue = []


async def ping_users():
    for user in users_in_queue:
        user.send_message_to_user("ping", {})


async def bind_to_game_server():
    print("Try connecting to the game server..")
    try:
        await get_game_server().connect()
    except (OSError, InvalidURI, InvalidHandshake, ConnectionClosedError, WebSocketException) as e:
        print(f"Failed to connect: {e}")


def is_user_already_in_queue(user_id):
    for user in users_in_queue:
        if user.get_user_id() == user_id:
            return True
    return False


async def check_game_server_health():
    if not get_game_server().is_connected():
        await bind_to_game_server()
        return False
    return True


async def send_users_to_server():
    selected_users = get_two_users()
    await get_game_server().send("createGame", {"userId1": selected_users[0].get_user_id(),
                                                "userId2": selected_users[1].get_user_id()})

    for user in selected_users:
        users_in_queue.remove(user)
        user.send_message_to_user("connectTo", {"server": "gameServer"})


async def main_check_loop():
    while True:
        if not await check_game_server_health():
            await gen.sleep(3)
            continue
        await ping_users()
        if len(users_in_queue) > 1:
            print("2 players founds, sending to game server..")
            await send_users_to_server()
        await gen.sleep(1)


def get_two_users():
    return random.sample(users_in_queue, 2)


class MatchMakingWebSocket(WebSocketHandler):
    def check_origin(self, origin):
        return True  # Allow all origins

    def open(self):
        cookies = self.request.cookies
        session_id = cookies.get("sessionid").value

        request_response = requests.post("http://user-management:8000/api/user/get_session_user/", json={"sessionId": session_id})
        if request_response.status_code != 200:
            print(f"An error occured with the session_id: {session_id}. Error code: {request_response.status_code}")
            self.close()
            return

        request_data = request_response.json()
        user_id = request_data["id"]
        if is_user_already_in_queue(user_id):
            print(f"An error occured with the session_id: {session_id}. The user is already in queue")
            self.write_message({"type": "error", "values": {"message": "You are already in the Matchmaking"}})
            return

        request_response = requests.get(f'http://user-management:8000/api/user/get_user/{user_id}/')
        if request_response.status_code != 200:
            print(f"An error occured with the id: {user_id}. Error code: {request_response.status_code}")
            self.close()
            return

        user_status = request_response.json()["status"]
        print(user_status)
        if user_status == "inGame":
            print(f"An error occured with the session_id: {session_id}. The user is already in game")
            self.write_message({"type": "error", "values": {"message": "You are already in a game"}})
            return

        user = User(self, user_id)
        users_in_queue.append(user)

        print(f'[+] The user ({user.get_user_id()}) {request_data["username"]} is connected to the matchmaking server.')

    def on_close(self):
        print(f"[-] A user leave the matchmaking server.")
        user = self.get_user_from_socket()
        if user:
            users_in_queue.remove(user)

    def get_user_from_socket(self):
        for user in users_in_queue:
            if user.get_socket() == self:
                return user
        return False


# WSGI container for Django
django_app = WSGIContainer(get_wsgi_application())

tornado_app = Application([
    (r"/ws/matchmaking", MatchMakingWebSocket),  # API handler path
    (r".*", FallbackHandler, dict(fallback=django_app)),  # Fallback to Django
])


if __name__ == "__main__":
    server = HTTPServer(tornado_app)
    server.listen(2607)
    print("Starting Tornado server on port 2607")
    WebSocketClient("ws://back-game:2605/ws/back")
    IOLoop.current().spawn_callback(main_check_loop)
    IOLoop.current().start()
