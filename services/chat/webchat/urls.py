from django.urls import path
from .views import message_list, invitations, accept_invitation, decline_invitation

urlpatterns = [
	path('api/chat/all-messages/', message_list, name='message_list'),
	path('api/chat/invitations/', invitations, name='invitations'),
	path('api/chat/accept_invitation/<int:invitationId>/', accept_invitation, name='accept_invitation'),
	path('api/chat/decline_invitation/<int:invitationId>/', decline_invitation, name='decline_invitation')
]
