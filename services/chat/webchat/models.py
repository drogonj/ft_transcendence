from django.db import models
from django.contrib.auth.models import AbstractUser

class Message(models.Model):
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)
	content = models.TextField()
	timestamp = models.DateTimeField(auto_now_add=True)
	room_name = models.CharField(max_length=255)

# class CustomUser(AbstractUser):
# 	muted_users = models.ManyToManyField('self', symmetrical=False, related_name='muted_by')
