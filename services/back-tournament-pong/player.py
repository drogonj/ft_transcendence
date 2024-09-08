class Player:
    def __init__(self, socket, user_id):
        self.__socket = socket
        self.__player_id = user_id

    def get_socket(self):
        return self.__socket

    def get_player_id(self):
        return self.__player_id

    def send_message_to_player(self, message_type, message_values):
        message = {}
        message["type"] = message_type
        message["values"] = message_values
        self.__socket.write_message(message)

    def kill_connection(self):
        self.__socket.close()
