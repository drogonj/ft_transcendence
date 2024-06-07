from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.utils.decorators import method_decorator
import mimetypes
import json

User = get_user_model()

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE', '')})

@method_decorator(csrf_protect, name='dispatch')
class LoginView(View):
    def post(self, request):
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'success': True, 'message': 'Login successful'})
        else:
            return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=400)

@method_decorator(csrf_protect, name='dispatch')
class SignupView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            confirm_password = data.get('confirm_password')

            if password != confirm_password:
                return JsonResponse({'error': 'Passwords does not match.'})

            if not username or not password:
                return JsonResponse({'error': 'Username and password are required.'}, status=400)

            if User.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Username already exists.'}, status=400)

            user = User.objects.create_user(username=username, password=password)
            user.save()

            return JsonResponse({'message': 'Signup successful.'})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data.'}, status=400)

@method_decorator(login_required, name='dispatch')
class LogoutView(View):
    def post(self, request):
        logout(request)
        return JsonResponse({'success': True, 'message': 'Logout successful'})

class IsAuthenticatedView(View):
    def get(self, request):
        is_authenticated = request.user.is_authenticated
        current_user = 'unknown'
        if is_authenticated:
            current_user = request.user.username
        return JsonResponse({'is_authenticated': is_authenticated, 'current_user': current_user})

@method_decorator(login_required, name='dispatch')
class LogoutView(View):
    def post(self, request):
        logout(request)
        return JsonResponse({'success': True, 'message': 'Logout successful'})

@login_required
def get_profile_picture(request):
    image = request.user.profil_image
    content_type = mimetypes.guess_type(request.user.profil_image.name)[0]

    return HttpResponse(image.read(), content_type=content_type)