from django.db import models

# Create your models here.
class Message(models.Model):
    user_id = models.IntegerField()
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    room_name = models.CharField(max_length=255)