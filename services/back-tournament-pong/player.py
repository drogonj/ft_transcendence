class Player:
    def __init__(self, socket, user_id, username):
        self.__socket = socket
        self.__player_id = user_id
        self.__username = username

    def get_socket(self):
        return self.__socket

    def get_player_id(self):
        return self.__player_id

    def get_username(self):
        return self.__username

    def send_message_to_player(self, message_type, message_values):
        message = {}
        message["type"] = message_type
        message["values"] = message_values
        self.__socket.write_message(message)

    def kill_connection(self):
        self.__socket.close()

    def dumps_player(self):
        return {"playerId": self.__player_id, "username": self.__username}
