# django_app.py
import redis
from django.core.management.base import BaseCommand

import logging
import sys
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger.info('--- JE PASSE DANS COMMAND WTF')

class Command(BaseCommand):
    help = 'Starts a Redis listener for game events'

    def handle(self, *args, **options):
        logger.info('--- Starting Redis listener')
        # Initialisez le client Redis
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
            logger.info(f"--- Received message: {message}")
            if message['type'] == 'message':
                self.handle_game_event(message['data'])

    def handle_game_event(self, data):
        # Traitez l'événement ici
        logger.info('--- Received game event: {}'.format(data))
        print(f"Received game event: {data}")
