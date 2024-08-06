
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class MatchManager(models.Manager):
    def get_matches_by_user(self, user):
        matchs = self.filter(user0=user) | self.filter(user1=user)
        return matchs

    def get_won_matches_by_user(self, user):
        matchs = self.filter(winner=user)
        return matchs

class Match(models.Model):
    player0     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player0')
    player1     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player1')

    score0      = models.IntegerField(default=0)
    score1      = models.IntegerField(default=0)

    winner      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='winner')

    objects     = MatchManager()
