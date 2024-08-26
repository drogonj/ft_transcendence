# django_app.py
import redis
from django.core.management.base import BaseCommand
import logging
import sys
import json
from games_data.models import Match

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

    def updatePlayerStats(self, player, opponent, match):
        if player==match.winner:
            player.victories+=1
            player.trophies+=10
            player.tournaments_won+=1 if match.tournament==True else 0
        elif opponent==match.winner:
            player.defeats+=1
            if player.trophies - 10 >= 0:
                player.trophies-=10
        player.winrate = round((player.victories / (player.victories + player.defeats)) * 100, 2)
        player.goals += match.score0 if player==match.player0 else match.score1
        player.save()

    def handle_game_event(self, data):
        logger.info('--- Received game event: {}'.format(data))

        if 'player0' not in data or 'player1' not in data:
            logger.info('--- Invalid game stats')
            return

        player0_data = data['player0']
        player1_data = data['player1']

        try:
            p1 = User.objects.get(id=player0_data['playerId'])
            p2 = User.objects.get(id=player1_data['playerId'])

            tournament = data.get('tournament', False)

            match = Match.objects.create(
                player0=p1,
                player1=p2,
                score0=player0_data['playerScore'],
                score1=player1_data['playerScore'],
                winner=p1 if player0_data['playerScore'] > player1_data['playerScore'] else (p2 if player0_data['playerScore'] < player1_data['playerScore'] else None),
                tournament=tournament
            )

            match.save()
            logger.info('--- Match data stored successfully')

            self.updatePlayerStats(p1, p2, match)
            self.updatePlayerStats(p2, p1, match)

        except:
            logger.error('--- Failed to store match data')
