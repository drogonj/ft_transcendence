"""
ASGI config for singlepageapp project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user-management.settings')
django_asgi_app = get_asgi_application()

from django_channels_jwt.middleware import JwtAuthMiddlewareStack
import friends.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JwtAuthMiddlewareStack (
        URLRouter(
            friends.routing.websocket_urlpatterns
        )
    ),
})
