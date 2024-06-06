from django.db import models
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
# Create your models here.

class MyAccountManager(BaseUserManager):
    def create_user(self, username, password=None):
        if not username:
            raise ValueError("Users must have an username")
        user = self.model(
            username=username,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password):
        print("COUCOU FDP")
        if not username:
            raise ValueError("Users must have an username")
        user = self.model(
            username=username,
            password=password
        )
        user.is_admin = True
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

def get_profil_image_filepath(self):
    return f'profile_images/{self.pk}/{"profile_image.jpg"}'

def get_default_profile_image():
    return "user-management/profile_image.jpg"
    
class Account(AbstractBaseUser):

    username        = models.CharField(max_length=30, unique=True)
    date_joined     = models.DateTimeField(verbose_name="date joined", auto_now_add=True)
    last_login      = models.DateTimeField(verbose_name="last login", auto_now=True)
    is_admin        = models.BooleanField(default=False)
    is_active       = models.BooleanField(default=False)
    is_superuser    = models.BooleanField(default=False)
    profil_image    = models.ImageField(max_length=255, upload_to=get_profil_image_filepath, null=True, blank=True, default=get_default_profile_image)

    objects = MyAccountManager()

    USERNAME_FIELD   = 'username'
    REQUIERED_FIELDS = ['username']

    def __str__(self):
        return self.username
    
    def get_profile_image_filename(self):
        return str(self.profil_image)[str(self.profil_image).index(f'profile_images/{self.pk}/'):]

    def has_perm(self, perm, obj=None):
        return self.is_admin
    
    def has_module_perms(self, app_label):
        return True
