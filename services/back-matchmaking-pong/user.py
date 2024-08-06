class User:
    def __init__(self, socket, socket_values):
        self.__socket = socket
        self.__user_id = socket_values["userId"]

    def get_socket(self):
        return self.__socket

    def get_user_id(self):
        return self.__user_id

    def send_message_to_user(self, message_type, message_values):
        message = {}
        message["type"] = message_type
        message["values"] = message_values
        self.__socket.write_message(message)

    def kill_connection(self):
        self.__socket.close()
