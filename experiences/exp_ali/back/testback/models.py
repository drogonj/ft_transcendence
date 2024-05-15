from django.db import models


class Example(models.Model):
    pseudo = models.CharField(max_length=100)
    level = models.IntegerField()
    elo = models.IntegerField()