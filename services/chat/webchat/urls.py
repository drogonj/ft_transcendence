from django.urls import path
from .views import message_list

urlpatterns = [
	path('api/chat/all-messages/', message_list, name='message_list'),
]
