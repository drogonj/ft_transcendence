from django.urls import path, re_path
from . import views

urlpatterns = [
	path('api/user/get_friends/', views.GetFriendsView.as_view(), name='get_friends'),
	path('api/user/get_received_friendship_requests/', views.GetReceivedFriendshipRequestsView.as_view(), name='get_received_friendship_requests'),
	path('api/user/add_friend/', views.AddFriendView.as_view(), name='add_friend'),
	path('api/user/remove_friend/', views.RemoveFriendView.as_view(), name='remove_friend'),
	path('api/user/accept_friendship_request/', views.AcceptFriendshipRequest.as_view(), name='accept_friendship_request'),
	path('api/user/decline_friendship_request/', views.DeclineFriendshipRequest.as_view(), name='decline_friendship_request'),
	path('api/user/search/', views.search_users, name='search_users'),
	path('api/user/get_users/', views.GetAllUsersDataView.as_view(), name='get_users'),
	path('api/user/get_user/<int:user_id>/', views.GetOneUserDataView.as_view(), name='get_user'),
	path('api/user/mute_toggle/<str:user_id>/', views.MuteToggleView.as_view(), name='mute_toggle'),
	path('api/user/get_mutelist/<str:user_id>/', views.GetMuteListView.as_view(), name='mute_list'),
]
