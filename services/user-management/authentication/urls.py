from django.urls import path, re_path
from django.conf.urls.static import static
from django.conf import settings
from . import views

urlpatterns = [
    path('api/user/login/', views.LoginView.as_view(), name='login'),
    # path('api/user/reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('api/user/update/', views.UserUpdateView.as_view(), name='update_user_info'),
    path('api/user/logout/', views.LogoutView.as_view(), name='logout'),
    path('api/user/signup/', views.SignupView.as_view(), name='signup'),
    path('api/user/is_authenticated/', views.IsAuthenticatedView.as_view(), name='is_authenticated'),
    path('api/user/get_csrf_token/', views.get_csrf_token, name='get_csrf_token'),
    path('api/user/info/', views.get_user_info, name='get_user_info'),
    path('api/user/get_avatar/', views.get_profile_picture, name='get_profile_picture'),
    path('api/user/oauth/redirect/', views.oauth_redirect, name='oauth_redirect'),
    path('api/user/oauth/callback/', views.oauth_callback, name='oauth_callback'),
    path('api/user/oauth/confirm_registration/', views.oauth_confirm_registration, name='oauth_confirm_registration'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
