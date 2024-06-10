from django.shortcuts import render
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.views import PasswordResetView
from django.urls import reverse_lazy
from django.views.generic import FormView
from django.shortcuts import redirect
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.views import View
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth.mixins import LoginRequiredMixin
import mimetypes
import requests
import json
import os

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
            email    = data.get('email')
            password = data.get('password')
            confirm_password = data.get('confirm_password')

            if password != confirm_password:
                return JsonResponse({'error': 'Passwords does not match.'})

            if not username or not password or not email:
                return JsonResponse({'error': 'Username, password or email are required.'}, status=400)

            if User.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Username already exists.'}, status=400)

            user = User.objects.create_user(intra_id=0, username=username, password=password)
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
    if (request.method != 'GET'):
        return HttpResponseBadRequest("Bad request")

    image = request.user.profil_image
    content_type = mimetypes.guess_type(request.user.profil_image.name)[0]
    return HttpResponse(image.read(), content_type=content_type)

def oauth_redirect(request):
    uri = os.getenv("42OAUTH_URI")
    uri += "&state=" + os.getenv("42OAUTH_STATE")
    return redirect(uri)

@csrf_exempt
def oauth_callback(request):
    #Creating POST to get API authorization token
    code = request.GET.get('code')
    if not code:
        return HttpResponseBadRequest("Bad request")
    data = {
        'grant_type': 'authorization_code',
        'client_id': os.getenv("42OAUTH_UID"),
        'client_secret': os.getenv("42OAUTH_SECRET"),
        'code': code,
        'redirect_uri': 'https://localhost:8080/api/user/oauth/callback/',
        'state': os.getenv('42OAUTH_STATE'),
    }

    try:
        #Get API authorization token
        response = requests.post('https://api.intra.42.fr/oauth/token', data=data)
        if response.status_code != 200:
            return HttpResponseBadRequest(f'Failed to retrieve token: {response.status_code} {response.text}')
        token_data = response.json()
        access_token = token_data.get('access_token')

        #Get user informations
        response = requests.get("https://api.intra.42.fr/v2/me", headers={'Authorization':f'Bearer {access_token}'})
        if response.status_code != 200:
            return HttpResponseBadRequest(f'Failed to retrieve user\'s datas: {response.status_code} {response.text}')
        user_data = response.json()
        # return HttpResponse(f'Token received:{token_data} User data:{response.json()}')

        if User.objects.filter(intra_id=user_data.get('id')).exists():
            user = User.objects.get(intra_id=user_data.get('id'))
            login(request, user)
            return redirect(os.getenv('WEBSITE_URL'))
        else:
            user = User.objects.create_user(
                intra_id=user_data.get('id'),
                username=user_data.get('login'),
                password='',
            )
            user.save()
            login(request, user)
            return redirect(os.getenv('WEBSITE_URL'))
            #return redirect(f'{os.getenv('WEBSITE_URL')}/change_password/?oauth_registration')

    except requests.exceptions.RequestException as e:
        return HttpResponseBadRequest(f'Request failed: {e}')

#TODO
# Erreur si le user dit non a l'autorisation de l'intra

    return HttpResponse(image.read(), content_type=content_type)

class ResetPasswordView(FormView):
    form_class = PasswordResetForm
    success_url = reverse_lazy('password_reset_done')

    def form_valid(self, form):
        form.save(request=self.request)
        return JsonResponse({'success': True})

    def form_invalid(self, form):
        errors = form.errors.get_json_data()
        return JsonResponse({'success': False, 'errors': errors})
    
def get_user_info(request):
    user = request.user
    profil_image_url = request.build_absolute_uri(user.profil_image.url)

    data = {
        'username': user.username,
        'email': user.email,
        'profil_image': profil_image_url,
        # Ajoutez d'autres champs d'utilisateur si nécessaire
    }
    return JsonResponse(data)

from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import FormView
from django.http import JsonResponse

@method_decorator(login_required, name='dispatch')
class UserUpdateView(LoginRequiredMixin, FormView):
    def post(self, request, *args, **kwargs):
        try:
            username = request.POST.get('username')
            email = request.POST.get('email')
            profile_picture = request.FILES.get('profil_image')

            user = request.user
            user.username = username
            user.email = email
            if profile_picture:
                user.profil_image = profile_picture
            user.save()

            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    def get(self, request, *args, **kwargs):
        return JsonResponse({'success': False, 'message': 'Invalid request method'})

