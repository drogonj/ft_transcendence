from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class FriendshipManager(models.Manager):
    def get_friends(self, user):
        friends = self.filter(from_user=user).values_list('to_user', flat=True)
        return User.objects.filter(id__in=friends)

    def exist(self, first, second):
        if self.filter(from_user=first, to_user=second).exists() \
            or self.filter(from_user=second, to_user=first).exists():
            return True
        return False

    def remove(self, user, friend):
        self.filter(from_user=user, to_user=friend).delete()
        self.filter(from_user=friend, to_user=user).delete()

class Friendship(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_from')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_to')
    created = models.DateTimeField(auto_now_add=True)

    objects = FriendshipManager()

    def __str__(self):
        return (f'{self.to_user} / {self.from_user}')


class FriendshipRequest(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_request_from')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_request_to')
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (f'{self.to_user} / {self.from_user}')

    def get_received_friendship_requests(self, user):
        return self.filter(to_user=user).values_list('from_user', flat=True)

    def get_sent_friendship_requests(self, user):
        return self.filter(from_user=user).values_list('to_user', flat=True)

    def accept(self):
        if Friendship.objects.exist(self.from_user, self.to_user):
            raise Exception('Friendship already exist')
        Friendship.objects.create(from_user=self.from_user, to_user=self.to_user)
        Friendship.objects.create(from_user=self.to_user, to_user=self.from_user)
        self.delete()

    def decline(self):
        self.delete()
