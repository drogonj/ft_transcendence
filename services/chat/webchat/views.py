from django.contrib.auth import get_user_model
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.views import View
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
import json, os, secrets, mimetypes, requests
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Message
from django.db.models import Q

User = get_user_model()

@method_decorator(login_required, name='dispatch')
class ListAllUsersView(View):
    def get(self, request):
        users = User.objects.all()
        user_data = [
            {
                'username': user.username,
                'id': user.id,
                'avatar': user.profil_image.url if user.profil_image else None,
                'is_connected': user.is_connected,
            }
            for user in users
        ]
        return JsonResponse({'users': user_data})