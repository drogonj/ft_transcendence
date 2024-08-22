from django.urls import path
from .views import message_list, invitations

urlpatterns = [
	path('api/chat/all-messages/', message_list, name='message_list'),
	path('api/chat/invitations/', invitations, name='invitations'),
]
