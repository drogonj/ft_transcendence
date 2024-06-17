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
from django.utils import timezone
from datetime import timedelta
import json, os, secrets, mimetypes, requests
from django.contrib.auth.hashers import make_password

User = get_user_model()

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE', '')})

@method_decorator(csrf_protect, name='dispatch')
class LoginView(View):
    def post(self, request):
        data = json.loads(request.body)
        user_auth = data.get('username')
        password = data.get('password')

        user = authenticate(request, username=user_auth, password=password)

        if not user:
            return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=400)
        elif not user.register_complete and user.intra_id != 0:
            return JsonResponse({'success': False, 'message': 'Registration with 42 not completed'})
        else:
            login(request, user, 'app.authentication_backends.EmailOrUsernameModelBackend')
            return JsonResponse({'success': True, 'message': 'Login successful'})

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

            user = User.objects.create_user(intra_id=0, username=username, email=email, password=password)

            user.save()
            login(request, user, 'app.authentication_backends.EmailOrUsernameModelBackend')

            return JsonResponse({'message': 'Signup successful.'})
        except Exception as e:
            return JsonResponse({'error': f'{e}'}, status=400)

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


        #If user already exist
        if User.objects.filter(intra_id=user_data.get('id')).exists():
            user = User.objects.get(intra_id=user_data.get('id'))
            if not user.register_complete:
                tmp_token = user.generate_tmp_token()
                user.save()
                return redirect(f"{os.getenv('WEBSITE_URL')}/confirm-registration/?token={tmp_token}&username={user_data.get('login')}")
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            return redirect(os.getenv('WEBSITE_URL'))
        else:  # Else register user
            user = User.objects.create_user(
                intra_id=user_data.get('id'),
                username=secrets.token_hex(30 // 2),
                email=user_data.get('email'),
                password='none',
            )
            user.get_intra_pic(user_data.get('image', {}).get('versions', {}).get('small'))
            tmp_token = user.generate_tmp_token()
            user.save()
            return redirect(f"{os.getenv('WEBSITE_URL')}/confirm-registration/?token={tmp_token}&username={user_data.get('login')}")
            #return redirect(f'{os.getenv('WEBSITE_URL')}/change_password/?oauth_registration')

    except requests.exceptions.RequestException as e:
        return HttpResponseBadRequest(f'Request failed: {e}')

@csrf_protect
def oauth_confirm_registration(request):
    if request.method != 'POST':
        return HttpResponseBadRequest("Bad request")

    data = json.loads(request.body)

    token = data.get('token')
    if not token or token == '':
        return JsonResponse({'error': 'No token provided'})

    if not User.objects.filter(tmp_token=token).exists():
        return JsonResponse({'error': 'Invalid token'})

    user = User.objects.get(tmp_token=token)
    if user.register_complete or user.intra_id == 0:
        return JsonResponse({'error': 'Invalid token'})

    time_diff = timezone.now() - user.token_creation_date
    if time_diff > timedelta(minutes=2):
        return JsonResponse({'error': 'Expired token, try Login with 42 again'})

    username = data.get('username')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    if password != confirm_password:
        return JsonResponse({'error': 'Passwords does not match'})

    if not username or User.objects.filter(username=username).exists():
        return JsonResponse({'error': 'Username already exists'})

    user.username = username
    user.password = make_password(password)
    user.tmp_token = ''
    user.register_complete = True
    user.save()
    login(request, user, backend='django.contrib.auth.backends.ModelBackend')

    return JsonResponse({'message': 'Success'})

#TODO
# Erreur si le user dit non a l'autorisation de l'intra

# class ResetPasswordView(FormView):
#     form_class = PasswordResetForm
#     success_url = reverse_lazy('password_reset_done')

#     def form_valid(self, form):
#         form.save(request=self.request)
#         return JsonResponse({'success': True})

#     def form_invalid(self, form):
#         errors = form.errors.get_json_data()
#         return JsonResponse({'success': False, 'errors': errors})

@login_required
def get_user_info(request):
    user = request.user
    profil_image_url = request.build_absolute_uri(user.profil_image.url)

    data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'profil_image': profil_image_url,
    }
    return JsonResponse(data)

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
                user.change_profile_pic(profile_picture)
            user.save()

            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    def get(self, request, *args, **kwargs):
        return JsonResponse({'success': False, 'message': 'Invalid request method'})

