import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user-management.settings')
django.setup()

User = get_user_model()

def reset_users_status():
    User.objects.all().update(status='offline')
    User.objects.all().update(is_connected=False)
    User.objects.all().update(active_connections=False)

    print("[+] All users status have been resetted.")

reset_users_status()
