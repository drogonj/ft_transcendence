from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

class MatchManager(models.Manager):
    def get_matches_by_user(self, user):
        matchs = self.filter(player0=user) | self.filter(player1=user)
        return matchs

class Match(models.Model):
    player0     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player0')
    player1     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player1')

    score0      = models.IntegerField(default=0)
    score1      = models.IntegerField(default=0)

    winner      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='winner', null=True)

    date        = models.DateTimeField(verbose_name="data", default=timezone.now)
    tournament  = models.BooleanField(default=False)

    objects     = MatchManager()
