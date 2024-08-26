from django.urls import path
from .views import message_list, invitations, accept_invitation, decline_invitation, get_csrf_token

urlpatterns = [
	path('api/chat/csrf/', get_csrf_token, name='get_csrf_token'),
	path('api/chat/messages/', message_list, name='message_list'),
	path('api/chat/invitations/', invitations, name='invitations'),
	path('api/chat/invitations/accepted/<int:invitationId>/', accept_invitation, name='accept_invitation'),
	path('api/chat/invitations/declined/<int:invitationId>/', decline_invitation, name='decline_invitation'),
]
