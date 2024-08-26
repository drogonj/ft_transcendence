from django.views.generic import FormView
from django.shortcuts import redirect, get_object_or_404
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
from django.db import IntegrityError

User = get_user_model()

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE', '')})

@method_decorator(csrf_protect, name='dispatch')
class LoginView(View):
    def post(self, request):

        if request.user and request.user.is_authenticated:
            return JsonResponse({'success': False, 'type': 'AlreadyLogged', f'message': f'You are already login as {request.user.username}'})

        data = json.loads(request.body)
        user_auth = data.get('username')
        password = data.get('password')

        user = authenticate(request, username=user_auth, password=password)

        if not user:
            return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=400)
        elif not user.register_complete and user.intra_id != 0:
            return JsonResponse({'success': False, 'message': 'Registration with 42 not completed'})
        else:
            login(request, user, 'authentication.authentication_backends.EmailOrUsernameModelBackend')
            return JsonResponse({'success': True, 'message': 'Login successful'})

@method_decorator(csrf_protect, name='dispatch')
class SignupView(View):
    def post(self, request):
        try:
            if request.user and request.user.is_authenticated:
                return JsonResponse({'success': False, 'type': 'AlreadyLogged', f'message': f'You are already login as {request.user.username}'})

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
            login(request, user, 'authentication.authentication_backends.EmailOrUsernameModelBackend')

            return JsonResponse({'message': 'Signup successful.'})
        except Exception as e:
            return JsonResponse({'error': f'{e}'}, status=400)

class IsAuthenticatedView(View):
    def get(self, request):
        is_authenticated = request.user.is_authenticated
        user_id = request.user.id
        current_user = 'unknown'
        if is_authenticated:
            current_user = request.user.username
        return JsonResponse({'is_authenticated': is_authenticated, 'current_user': current_user, 'user_id': user_id})

@method_decorator(login_required, name='dispatch')
class LogoutView(View):
    def post(self, request):
        if request.user and request.user.is_authenticated:
            logout(request)
            return JsonResponse({'success': True, 'message': 'Logout successful'})
        else:
            return HttpResponseBadRequest()

@login_required
def get_profile_picture(request):
    if (request.method != 'GET'):
        return HttpResponseBadRequest("Bad request")

    image = request.user.profil_image
    content_type = mimetypes.guess_type(request.user.profil_image.name)[0]
    return HttpResponse(image.read(), content_type=content_type)

def oauth_redirect(request):
    uri = os.getenv("OAUTH_URI")
    uri += "&state=" + os.getenv("OAUTH_STATE")
    return redirect(uri)

@csrf_exempt
def oauth_callback(request):
    # Creating POST to get API authorization token
    code = request.GET.get('code')
    if not code or request.GET.get('error'):
        return redirect(f"https://{os.getenv('WEBSITE_URL')}/")

    data = {
        'grant_type': 'authorization_code',
        'client_id': os.getenv("OAUTH_UID"),
        'client_secret': os.getenv("OAUTH_SECRET"),
        'code': code,
        'redirect_uri': f'https://{os.getenv("WEBSITE_URL")}/api/user/oauth/callback/',
        'state': os.getenv('OAUTH_STATE'),
    }

    try:
        # Get API authorization token
        response = requests.post('https://api.intra.42.fr/oauth/token', data=data)
        if response.status_code != 200:
            return HttpResponseBadRequest(f'Failed to retrieve token: {response.status_code} {response.text}')

        token_data = response.json()
        access_token = token_data.get('access_token')

        # Get user information
        response = requests.get("https://api.intra.42.fr/v2/me", headers={'Authorization': f'Bearer {access_token}'})
        if response.status_code != 200:
            return HttpResponseBadRequest(f'Failed to retrieve user\'s data: {response.status_code} {response.text}')

        user_data = response.json()

        # If user already exists
        user, created = User.objects.get_or_create(
            intra_id=user_data.get('id'),
            defaults={
                'username': secrets.token_hex(30 // 2),
                'email': user_data.get('email'),
                'password': 'none',
            }
        )

        if created:
            # New user created, perform post-creation actions
            user.get_intra_pic(user_data.get('image', {}).get('versions', {}).get('small'))
            tmp_token = user.generate_tmp_token()
            user.save()
            return redirect(f"https://{os.getenv('WEBSITE_URL')}/confirm-registration/?token={tmp_token}&username={user_data.get('login')}")
        else:
            # Existing user
            if not user.register_complete:
                tmp_token = user.generate_tmp_token()
                user.save()
                return redirect(f"https://{os.getenv('WEBSITE_URL')}/confirm-registration/?token={tmp_token}&username={user_data.get('login')}")
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            return redirect(f"https://{os.getenv('WEBSITE_URL')}")

    except requests.exceptions.RequestException as e:
        return HttpResponseBadRequest(f'Request failed: {e}')
    except IntegrityError as e:
        return HttpResponseBadRequest(f'Integrity error: {e}')

@csrf_protect
def oauth_confirm_registration(request):
    if request.method != 'POST':
        return HttpResponseBadRequest("Bad request")

    if request.user and request.user.is_authenticated:
        return JsonResponse({'success': False, 'type': 'AlreadyLogged', f'message': f'You are already login as {request.user.username}'})

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

    intra_pic = data.get('take_intra_pic')
    if not intra_pic:
        user.profil_image = "avatars/default.png"
    user.username = username
    user.password = make_password(password)
    user.register_complete = True
    user.save()
    login(request, user, backend='django.contrib.auth.backends.ModelBackend')

    return JsonResponse({'message': 'Success'})

@method_decorator(login_required, name='dispatch')
class UserInfoView(View):
    def get(self, request, user_id=None):
        if user_id:
            user = get_object_or_404(User, id=user_id)
        else:
            user = request.user
        profil_image_url = user.profil_image.url
        data = {
            'username': user.username,
            'avatar': profil_image_url,
            'user_id': user.id,
            'email': user.email,
            'trophies': user.trophies,
            'winrate': user.winrate,
            'victories': user.victories,
            'defeats': user.defeats,
            'goals': user.goals,
            'tournaments_won': user.tournaments_won,
        }
        return JsonResponse(data)

@method_decorator(login_required, name='dispatch')
class UserUpdateView(LoginRequiredMixin, FormView):
    def post(self, request, *args, **kwargs):
        try:
            username = request.POST.get('username')
            profile_picture = request.FILES.get('profil_image')

            user = request.user
            user.username = username
            if profile_picture:
                user.change_profile_pic(profile_picture)
            user.save()

            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    def get(self, request, *args, **kwargs):
        return JsonResponse({'success': False, 'message': 'Invalid request method'})


@method_decorator(login_required, name='dispatch')
class ChangeUsernameView(LoginRequiredMixin, FormView):
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            username = data.get('username')

            if not username:
                return HttpResponseBadRequest('no username provided')

            request.user.username = username
            request.user.save()
            return JsonResponse({'success': True, 'message': 'username changed'})
        except Exception as e:
            return HttpResponseBadRequest(f'error: {e}')

@method_decorator(login_required, name='dispatch')
class ChangePasswordView(LoginRequiredMixin, FormView):
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            password = data.get('password')
            new_password = data.get('newPassword')
            confirm_password = data.get('confirmNewPassword')

            if not new_password or not confirm_password or new_password != confirm_password:
                return HttpResponseBadRequest()

            if not password or not request.user.check_password(password):
                return HttpResponseBadRequest()

            request.user.set_password(new_password)
            request.user.save()

            user = authenticate(request, username=request.user.username, password=password)
            login(request, user, 'authentication.authentication_backends.EmailOrUsernameModelBackend')

            return JsonResponse({'success': True, 'message': 'password changed'})

        except Exception as e:
            return HttpResponseBadRequest(f'error: {e}')

@method_decorator(login_required, name='dispatch')
class ChangeAvatarView(View):
    def post(self, request, *args, **kwargs):
        try:
            profile_picture = request.FILES.get('avatar')

            if not profile_picture:
                return HttpResponseBadRequest('No image provided')

            user = request.user
            user.change_profile_pic(profile_picture)

            return JsonResponse({'success': True, 'avatar': user.profil_image.url})

        except Exception as e:
            return HttpResponseBadRequest('Failed to upload image')
