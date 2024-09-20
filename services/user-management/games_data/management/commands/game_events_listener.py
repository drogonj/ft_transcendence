# django_app.py
import redis
from django.core.management.base import BaseCommand
import logging
import sys
import json
import requests
import time

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

from django.contrib.auth import get_user_model
User = get_user_model()

class Command(BaseCommand):
    help = 'Starts a Redis listener for game events'

    def handle(self, *args, **options):
        logger.info('--- Starting Redis listener')
        try:
            redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)
            redis_client.ping()
            logger.info("--- Connected to Redis successfully")
        except redis.exceptions.ConnectionError as e:
            logger.error("--- Failed to connect to Redis", exc_info=e)
            return

        pubsub = redis_client.pubsub()
        pubsub.subscribe('game_events')

        logger.info("--- Listening for game events...")

        for message in pubsub.listen():
            if message['type'] == 'message':
                data = json.loads(message['data'])
                self.handle_game_event(data)

    def handle_game_event(self, data):
        time.sleep(0.5)
        headers = {'Content-Type': 'application/json'}
        response = requests.post('http://localhost:8000/backend/handle_game_events/', data=json.dumps(data), headers=headers)
        if response.status_code == 200:
            logger.info(f'--- Game Event transferred successfully')
        else:
            logger.error(f'--- Failed to transfer Game Event')
