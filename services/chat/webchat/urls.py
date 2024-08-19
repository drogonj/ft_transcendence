from django.urls import path
from .views import MessageListCreate, PrivateMessageListCreate, message_list


urlpatterns = [
	path('api/chat/all-messages/', message_list, name='message_list'),
	path('api/chat/messages/', MessageListCreate.as_view(), name='message-list-create'),
	path('api/chat/private-messages/', PrivateMessageListCreate.as_view(), name='private-message-list-create'),
]
