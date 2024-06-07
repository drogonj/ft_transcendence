from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
# Create your models here.

class MyAccountManager(BaseUserManager):
    def create_user(self, username, password):
        if not username:
            raise ValueError("Users must have an username")
        user = self.model(
            username=username,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password):
        if not username:
            raise ValueError("Users must have an username")
        user = self.model(
            username=username,
            password=password
        )
        user.is_admin = True
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save(using=self._db)
        return user

#TODO Avatar upload
def get_profil_image_filepath(self):
    return f'avatars/{self.pk}/{"profile_image.jpg"}'

def get_default_profile_image():
    return "avatars/default.png"
    
class Account(AbstractBaseUser):

    username        = models.CharField(max_length=30, unique=True)
    date_joined     = models.DateTimeField(verbose_name="date joined", auto_now_add=True)
    last_login      = models.DateTimeField(verbose_name="last login", auto_now=True)
    is_admin        = models.BooleanField(default=False)
    is_staff        = models.BooleanField(default=False)
    is_active       = models.BooleanField(default=True)
    is_superuser    = models.BooleanField(default=False)
    profil_image    = models.ImageField(max_length=255, upload_to=get_profil_image_filepath, default=get_default_profile_image)

    objects = MyAccountManager()

    USERNAME_FIELD   = 'username'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username
    
    def get_profile_image_filename(self):
        return str(self.profil_image)[str(self.profil_image).index(f'profile_images/{self.pk}/'):]

    def has_perm(self, perm, obj=None):
        return self.is_admin
    
    def has_module_perms(self, app_label):
        return True
