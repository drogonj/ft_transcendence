from django.db import models
from django.contrib.auth.models import AbstractUser

class Message(models.Model):
	type = models.CharField(max_length=255)
	content = models.TextField(max_length=500)
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)
	timestamp = models.DateTimeField(auto_now_add=True)

class PrivateMessage(models.Model):
	type = models.CharField(max_length=255)
	content = models.TextField(max_length=500)
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)
	timestamp = models.DateTimeField(auto_now_add=True)
	receiver_id = models.IntegerField()
	receiver_username = models.CharField(max_length=255)

class MessageFromAuth(models.Model):
	type = models.CharField(max_length=255)
	content = models.TextField(max_length=500)
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)
	is_connected = models.BooleanField()

class MessageFromChat(models.Model):
	type = models.CharField(max_length=255)
	content = models.TextField(max_length=500)
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)