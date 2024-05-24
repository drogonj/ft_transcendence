
from django.urls import path
from .views import LoginView, LogoutView, IsAuthenticatedView, IndexView

urlpatterns = [
    path('', IndexView.as_view(), name='index'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('api/is_authenticated/', IsAuthenticatedView.as_view(), name='is_authenticated'),
]
