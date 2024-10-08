import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user-management.settings')
django.setup()

from friends.models import Friendship
User = get_user_model()

for u in range(20):
    email = f'test{u}@mail.com'
    username = f'test{u}'
    password = 'JESUISUNSUPERMUTANT123'

    if not User.objects.filter(username=username).exists():
        User.objects.create_user(intra_id=0, email=email, username=username, password=password)

users = list(User.objects.all())

# Set all tests user as friends
for i in range(len(users)):
    for j in range(i + 1, len(users)):
        if not Friendship.objects.filter(from_user=users[i], to_user=users[j]).exists():
            Friendship.objects.create(from_user=users[i], to_user=users[j])
            Friendship.objects.create(from_user=users[j], to_user=users[i])

print('Test users created')