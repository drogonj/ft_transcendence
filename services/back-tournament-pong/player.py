import json

from tornado.websocket import WebSocketClosedError


class Player:
    def __init__(self, socket, user_id, username):
        self.__socket = socket
        self.__player_id = int(user_id)
        self.__username = username
        self.__is_host = False

    def get_socket(self):
        return self.__socket

    def get_player_id(self):
        return self.__player_id

    def get_username(self):
        return self.__username

    def get_is_host(self):
        return self.__is_host

    def set_is_host(self, is_host):
        self.__is_host = is_host

    def set_socket(self, socket):
        self.__socket = socket

    def send_message_to_player(self, message_type, message_values):
        message = {}
        message["type"] = message_type
        message["values"] = message_values
        try:
            self.__socket.write_message(json.dumps(message))
        except (WebSocketClosedError, AttributeError):
            print("Message can't be send: Client is disconnected.")

    def kill_connection(self):
        self.__socket.close()

    def dumps_player(self):
        return {"playerId": self.__player_id, "username": self.__username, "host": self.__is_host}
