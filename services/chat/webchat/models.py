from django.db import models

class Message(models.Model):
	type = models.CharField(max_length=255)
	content = models.TextField(max_length=500)
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)
	timestamp = models.DateTimeField()

class PrivateMessage(models.Model):
	type = models.CharField(max_length=255)
	content = models.TextField(max_length=500)
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)
	timestamp = models.DateTimeField()
	receiver_id = models.IntegerField()
	receiver_username = models.CharField(max_length=255)
