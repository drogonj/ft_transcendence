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

    def cancel_friendship(self, user, friend):
        self.filter(from_user=user, to_user=friend).delete()
        self.filter(from_user=friend, to_user=user).delete()

class Friendship(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_from')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_to')
    created = models.DateTimeField(auto_now_add=True)

    objects = FriendshipManager()

    def __str__(self):
        return (f'{self.to_user} / {self.from_user}')

class FriendshipRequestManager(models.Manager):
    def get_received_friendship_requests(self, user):
        return self.filter(to_user=user)

    def get_sent_friendship_requests(self, user):
        return self.filter(from_user=user)

    def get_friendship_request_by_usernames(self, from_user, to_user):
        if self.filter(from_user=from_user, to_user=to_user).exists():
            return self.filter(from_user=from_user, to_user=to_user)
        return None

    def accept_friendship_request(self, to_user, from_user):
        if not self.filter(from_user=from_user, to_user=to_user).exists():
            raise Exception('No friendship request found')
        if Friendship.objects.exist(from_user, to_user):
            raise Exception('Friendship already exist')
        Friendship.objects.create(from_user=from_user, to_user=to_user)
        Friendship.objects.create(from_user=to_user, to_user=from_user)
        self.filter(from_user=from_user, to_user=to_user).delete()

    def cancel_friendship_request(self, to_user, from_user):
        if self.filter(from_user=from_user, to_user=to_user).exists():
            self.filter(from_user=from_user, to_user=to_user).delete()

class FriendshipRequest(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_request_from')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_request_to')
    created = models.DateTimeField(auto_now_add=True)

    objects = FriendshipRequestManager()

    def __str__(self):
        return (f'{self.to_user} / {self.from_user}')
