from django.urls import path
from . import views

urlpatterns = [
	path('api/chat/fetch_users/', views.FetchUserDataView.as_view(), name='fetch_users'),
]
