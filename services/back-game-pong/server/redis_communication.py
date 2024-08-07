import redis
import json

r = redis.Redis(host='redis', port=6379, decode_responses=True)

def send_to_redis(data):
    data_json = json.dumps(data)
    r.publish("game_events", data_json)

def create_data_to_send(players):
    data = {"player0": {}, "player1": {}}
    for index, player in enumerate(players):
        data["player" + str(index)]["playerId"] = player.get_user_id()
        data["player" + str(index)]["playerScore"] = player.get_score()
    return data
