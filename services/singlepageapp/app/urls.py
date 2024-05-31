
from django.urls import path, re_path
from django.views.generic import TemplateView
from django.views.generic.base import RedirectView
from django.http import Http404
from .views import LoginView, SignupView, LogoutView, IsAuthenticatedView, IndexView, get_csrf_token, fileNotFoundView

urlpatterns = [
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/signup/', SignupView.as_view(), name='signup'),
    path('api/is_authenticated/', IsAuthenticatedView.as_view(), name='is_authenticated'),
    path('api/get_csrf_token/', get_csrf_token, name='get_csrf_token'),
    re_path(r'^.*\..*$', fileNotFoundView.as_view(), name='file_not_found'),
    re_path(r'^.*$', IndexView.as_view(), name='index'),
]
