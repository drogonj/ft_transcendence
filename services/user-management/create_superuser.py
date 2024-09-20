import os
import django
from django.core.management.base import CommandError
from django.contrib.auth import get_user_model
from authentication.vault_client import get_vault_client

vault_client = get_vault_client()
db_secrets = vault_client.read_secret('ft_transcendence/database')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user-management.settings')
django.setup()

User = get_user_model()

email = db_secrets.get("DJANGO_SUPERUSER_EMAIL")
username = db_secrets.get('DJANGO_SUPERUSER_USERNAME')
password = db_secrets.get('DJANGO_SUPERUSER_PASSWORD')

if not email:
    raise CommandError('DJANGO_SUPERUSER_EMAIL must be set')
if not username:
    raise CommandError('DJANGO_SUPERUSER_USERNAME must be set')
if not password:
    raise CommandError('DJANGO_SUPERUSER_PASSWORD must be set')

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(email=email, username=username, password=password)
    print(f'Superuser {username} created')
else:
    print(f'Superuser {username} already exists')
