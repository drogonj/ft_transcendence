from django.db import models
from django.contrib.auth.models import AbstractUser

class Message(models.Model):
	type = models.CharField(max_length=255)
	content = models.TextField()
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)
	timestamp = models.DateTimeField(auto_now_add=True)

class MessageFromAuth(models.Model):
	type = models.CharField(max_length=255)
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)
	is_connected = models.BooleanField()

# class CustomUser(AbstractUser):
# 	muted_users = models.ManyToManyField('self', symmetrical=False, related_name='muted_by')
