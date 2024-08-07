import redis
import pickle


r = redis.Redis(host='redis', port=6379, decode_responses=True)


def send_to_redis(data):
    r.publish("game_events", pickle.dumps(data))


def create_data_to_send(players):
    data = {"player0": {}, "player1": {}}
    for index, player in enumerate(players):
        data["player" + str(index)]["playerId"] = player.get_user_id()
        data["player" + str(index)]["playerScore"] = player.get_score()
    return data
