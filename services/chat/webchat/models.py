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

class MuteListManager(models.Manager):
	def create_mute_list(self, user_id):
		mute_list = self.create(user_id=user_id)
		return mute_list

	def get_or_create_mute_list(self, user_id):
		try:
			mute_list = self.get(user_id=user_id)
		except MuteList.DoesNotExist:
			mute_list = self.create_mute_list(user_id)
		return mute_list
	
	def get_mute_list(self, user_id):
		return self.get(user_id=user_id)
	
	def can_send_message(self, user_id, receiver_id):
		mute_list = self.get_mute_list(receiver_id)
		return not mute_list.muted_users.filter(user_id=user_id).exists()

class MuteList(models.Model):
	user_id = models.IntegerField()
	muted_users = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='muted_by')

	objects = MuteListManager()

	def mute_user(self, user_id):
		self.muted_users.add(user_id)
	
	def demute_user(self, user_id):
		self.muted_users.remove(user_id)
