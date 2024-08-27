import redis
from redis.exceptions import ConnectionError, TimeoutError, RedisError
import json


redis_server = redis.Redis(host='redis', port=6379, decode_responses=True)
redis_data_save = []


def send_to_redis():
    for data in redis_data_save:
        data_json = json.dumps(data)
        try:
            redis_server.publish("game_events", data_json)
            redis_data_save.remove(data)
        except (ConnectionError, TimeoutError, RedisError) as e:
            print(f"Can't reach Redis: {e}")
            return


def create_data_to_send(players):
    data = {"player0": {}, "player1": {}}
    for index, player in enumerate(players):
        data["player" + str(index)]["playerId"] = player.get_user_id()
        data["player" + str(index)]["playerScore"] = player.statistics.score
    redis_data_save.append(data)
