from django.db import models
import logging

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

class MuteListManager(models.Manager):
	def create_mute_list(self, user_id):
		mute_list = self.create(user_id=user_id)
		mute_list.save()
		return mute_list

	def get_or_create_mute_list(self, user_id):
		if user_id is None:
			raise ValueError("user_id cannot be None")
		
		try:
			mute_list = self.get(user_id=user_id)
		except MuteList.DoesNotExist:
			mute_list = self.create_mute_list(user_id)
		return mute_list
	
	def get_mute_list(self, user_id):
		return self.get(user_id=user_id)
	
	def can_send_message(self, user_id, receiver_id):
		try:
			mute_list = self.get_mute_list(user_id)
			muted_users_ids = mute_list.muted_users.values_list('user_id', flat=True)
			logging.info(f'List of muted users: {muted_users_ids}')
			is_muted = receiver_id in muted_users_ids
			logging.info(f'is muted? {is_muted}')
			return not is_muted
		except MuteList.DoesNotExist:
			return True

class MuteList(models.Model):
	user_id = models.IntegerField(primary_key=True)
	muted_users = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='muted_by')

	objects = MuteListManager()

	def mute_user(self, user_id):
		self.muted_users.add(user_id)
		self.save()

	def unmute_user(self, user_id):
		self.muted_users.remove(user_id)
		self.save()
