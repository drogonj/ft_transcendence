from django.db import models

class Message(models.Model):
    user_id = models.IntegerField()
    username = models.CharField(max_length=255)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    room_name = models.CharField(max_length=255)