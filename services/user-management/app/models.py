from django.db import models
from django.contrib.auth.models import AbstractUser

class TranscendenceUser(AbstractUser):
    # Removed fields
    first_name = None
    last_name = None
    email = None

    profile_picture = models.ImageField(default='images/default_profile_pic.png')
    intra_uid = models.CharField(max_length=100, blank=True, null=True, default=None)
