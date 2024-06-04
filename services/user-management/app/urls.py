
from django.urls import path, re_path
from .views import LoginView, SignupView, LogoutView, IsAuthenticatedView, get_csrf_token

urlpatterns = [
    path('api/user/login/', LoginView.as_view(), name='login'),
    path('api/user/logout/', LogoutView.as_view(), name='logout'),
    path('api/user/signup/', SignupView.as_view(), name='signup'),
    path('api/user/is_authenticated/', IsAuthenticatedView.as_view(), name='is_authenticated'),
    path('api/user/get_csrf_token/', get_csrf_token, name='get_csrf_token'),
]
