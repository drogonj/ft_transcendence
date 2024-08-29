from django.contrib.auth.signals import user_logged_out
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@receiver(user_logged_out)
async def disconnect_websocket_on_logout(sender, request, user, **kwargs):
    if user.is_authenticated:
        group_name = f"user_{user.id}"
        channel_layer = get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'close.websocket',
            }
        )