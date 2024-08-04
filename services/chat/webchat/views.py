from django.contrib.auth.signals import user_logged_out
from django.dispatch import receiver
from .consumers import user_to_consumer
import asyncio

@receiver(user_logged_out)
def on_user_logged_out(sender, request, user, **kwargs):
	consumer_instance = user_to_consumer.get(user)
	asyncio.run(consumer_instance.logout())