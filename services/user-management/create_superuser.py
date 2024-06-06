import os
import django
from django.core.management.base import CommandError
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user-management.settings')
django.setup()

User = get_user_model()

username = os.getenv('DJANGO_SUPERUSER_USERNAME')
email = os.getenv('DJANGO_SUPERUSER_EMAIL')
password = os.getenv('DJANGO_SUPERUSER_PASSWORD')

if not username:
    raise CommandError('DJANGO_SUPERUSER_USERNAME must be set')
if not email:
    raise CommandError('DJANGO_SUPERUSER_EMAIL must be set')
if not password:
    raise CommandError('DJANGO_SUPERUSER_PASSWORD must be set')

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f'Superuser {username} created')
else:
    print(f'Superuser {username} already exists')
