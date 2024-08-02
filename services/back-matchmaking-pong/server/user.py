class User:
    def __init__(self, socket, socket_values):
        self.__socket = socket
        self.__username = socket_values["username"]

    def get_socket(self):
        return self.__socket

    def get_username(self):
        return self.__username
