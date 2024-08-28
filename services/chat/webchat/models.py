from django.db import models

class Message(models.Model):
	messageId = models.AutoField(primary_key=True)
	type = models.CharField(max_length=255)
	content = models.TextField(max_length=200)
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)
	timestamp = models.DateTimeField()

class PrivateMessage(models.Model):
	messageId = models.AutoField(primary_key=True)
	type = models.CharField(max_length=255)
	content = models.TextField(max_length=500)
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)
	timestamp = models.DateTimeField()
	receiver_id = models.IntegerField()
	receiver_username = models.CharField(max_length=255)

class InvitationToPlay(models.Model):
	invitationId = models.AutoField(primary_key=True)
	status = models.CharField(max_length=50, default='pending')
	type = models.CharField(max_length=255)
	user_id = models.IntegerField()
	username = models.CharField(max_length=255)
	timestamp = models.DateTimeField()
	receiver_id = models.IntegerField()
	receiver_username = models.CharField(max_length=255)
