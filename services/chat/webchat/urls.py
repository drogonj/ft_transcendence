from django.urls import path
from .views import message_list
from .views import MessageListCreate, PrivateMessageListCreate, MessageFromAuthListCreate, MessageFromChatListCreate, message_list
from .views import MessageListCreate, message_list

urlpatterns = [
	path('api/chat/all-messages/', message_list, name='message_list'),
	path('api/chat/messages/', MessageListCreate.as_view(), name='message-list-create'),
	path('api/chat/private-messages/', PrivateMessageListCreate.as_view(), name='private-message-list-create'),
	path('api/chat/messages-from-auth/', MessageFromAuthListCreate.as_view(), name='message-from-auth-list-create'),
	# path('api/chat/messages-from-chat/', MessageFromChatListCreate.as_view(), name='message-from-chat-list-create'),
]
