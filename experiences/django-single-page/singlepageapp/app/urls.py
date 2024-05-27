
from django.urls import path, re_path
from django.views.generic import TemplateView
from .views import LoginView, SignupView, LogoutView, IsAuthenticatedView, IndexView, get_csrf_token

urlpatterns = [
    path('', IndexView.as_view(), name='index'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('api/is_authenticated/', IsAuthenticatedView.as_view(), name='is_authenticated'),
    path('api/get_csrf_token/', get_csrf_token, name='get_csrf_token'),
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]
