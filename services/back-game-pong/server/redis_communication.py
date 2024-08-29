import redis
from redis.exceptions import ConnectionError, TimeoutError, RedisError
import json


redis_server = redis.Redis(host='redis', port=6379, decode_responses=True)
redis_game_data_save = []
redis_game_notif_save = []

def send_game_data_to_redis():
    for data in redis_game_data_save:
        data_json = json.dumps(data)
        try:
            redis_server.publish("game_events", data_json)
            redis_game_data_save.remove(data)
        except (ConnectionError, TimeoutError, RedisError) as e:
            print(f"Can't reach Redis: {e}")
            return

def store_game_data(players):
    data = {"type": "game_data", "player0": {}, "player1": {}}
    for index, player in enumerate(players):
        data["player" + str(index)]["playerId"] = player.get_user_id()
        data["player" + str(index)]["playerScore"] = player.statistics.score
    redis_game_data_save.append(data)

def send_game_started_to_redis():
    for notif in redis_game_notif_save:
        data_json = json.dumps(notif)
        try:
            redis_server.publish("game_events", data_json)
            redis_game_notif_save.remove(notif)
        except (ConnectionError, TimeoutError, RedisError) as e:
            print(f"Can't reach Redis: {e}")
            return

def store_game_started_data(players):
    data = {"type": "game_started", "player0": {}, "player1": {}}
    for index, player in enumerate(players):
        data["player" + str(index)]["playerId"] = player.get_user_id()
    redis_game_notif_save.append(data)
