from django.urls import path
from . import views

urlpatterns = [
	path('api/chat/get_users/', views.ListAllUsersView.as_view(), name='get_users'),
]
