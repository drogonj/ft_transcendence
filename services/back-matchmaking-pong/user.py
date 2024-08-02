class User:
    def __init__(self, socket, socket_values):
        self.__socket = socket
        self.__username = socket_values["username"]

    def get_socket(self):
        return self.__socket

    def get_username(self):
        return self.__username

    def send_message_to_user(self, message_type, message_values):
        message = {}
        message["type"] = message_type
        message["values"] = message_values
        self.__socket.send(message)

    def kill_connection(self):
        self.__socket.close()
