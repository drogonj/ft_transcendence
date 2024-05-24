from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views import View
from django.middleware.csrf import get_token
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
import json

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

    def get(self, request):
        csrf_token = get_token(request)
        return JsonResponse({'csrfToken': csrf_token})

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

class IndexView(View):
    def get(self, request):
        return render(request, 'index.html')

