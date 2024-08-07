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

    if players[0].get_score() > players[1].get_score():
        data["player0"]["winner"] = 1
    else:
        data["player1"]["winner"] = 1

    return data
