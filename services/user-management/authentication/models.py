from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.core.validators import validate_email, RegexValidator
from django.core.exceptions import ValidationError
from django.core.files import File
from django.utils import timezone
from PIL import Image, UnidentifiedImageError
import requests
from io import BytesIO
import uuid
import os

class MyAccountManager(BaseUserManager):
    def create_user(self, intra_id, email, username, password, **extra_fields):
        try:
            account = Account(intra_id=intra_id, email=email, username=username, **extra_fields)
            account.set_password(password)
            account.full_clean()
            account.save()
            return account
        except ValidationError as e:
            print(f'Validation error: {e}')
            raise e

    def create_superuser(self, email, username, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)

        return self.create_user(0, email, username, password, **extra_fields)


def get_profil_image_filepath(self, filename):
    extension = os.path.splitext(filename)[1]
    return f'profil_images/{self.pk}/profile_image{extension}'

def get_default_profile_image():
    return "avatars/default.png"

class Account(AbstractBaseUser):

    #Username validator
    alphanumeric = RegexValidator(r'^[0-9a-zA-Z]*$', 'Only alphanumeric characters are allowed.')

    email               = models.EmailField(max_length=60, unique=True, validators=[validate_email])
    username            = models.CharField(max_length=30, unique=True, validators=[alphanumeric])
    date_joined         = models.DateTimeField(verbose_name="date joined", auto_now_add=True)
    last_login          = models.DateTimeField(verbose_name="last login", auto_now=True)
    is_admin            = models.BooleanField(default=False)
    is_staff            = models.BooleanField(default=False)
    is_active           = models.BooleanField(default=True)
    is_superuser        = models.BooleanField(default=False)
    profil_image        = models.ImageField(max_length=255, upload_to=get_profil_image_filepath, default=get_default_profile_image)

    is_connected        = models.BooleanField(default=False)

    intra_id            = models.IntegerField(default=0)
    register_complete   = models.BooleanField(default=False)
    tmp_token           = models.CharField(max_length=100, unique=True, blank=True, null=True)
    token_creation_date = models.DateTimeField(verbose_name="token_creation_date", default=timezone.now)

    objects = MyAccountManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

    def __str__(self):
        return self.username

    def get_profile_image_filename(self):
        return str(self.profil_image)[str(self.profil_image).index(f'profile_images/{self.pk}/'):]

    def generate_tmp_token(self):
        self.tmp_token = uuid.uuid4().hex
        self.token_creation_date = timezone.now()
        return self.tmp_token

    def get_info(self):
        return [
            self.username,
            self.profil_image.url,
        ]

    def has_perm(self, perm, obj=None):
        return self.is_admin
    
    def has_module_perms(self, app_label):
        return True

    def get_intra_pic(self, link):
        if not link:
            return False
        response = requests.get(link)
        if response.status_code == 200:
            image = BytesIO(response.content)
            image_file = File(image, name=f'{self.id}.jpg')
            self.profil_image.save(f'{self.id}.jpg', image_file)
            self.save()
        else:
            return False

    def change_profile_pic(self, new_image):
        try:
            extension = os.path.splitext(new_image.name)[1].lower()
            if extension not in self.SUPPORTED_IMAGE_EXTENSIONS:
                raise Exception('Extension not supported')

            try:
                with Image.open(new_image) as img:
                    img.verify()
            except Exception as e:
                raise Exception('Corrupted file')

            if self.profil_image.path != "avatars/default.png":
                if os.path.isfile(self.profil_image.path):
                    os.remove(self.profil_image.path)

            self.profil_image = new_image
            self.save()
        except Exception as e:
            raise e