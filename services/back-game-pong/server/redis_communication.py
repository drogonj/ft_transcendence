import redis


r = redis.Redis(host='localhost', port=6379, decode_responses=True)


def send_to_redis(data):
    r.set(data)

