from django.urls import path, re_path
from django.conf.urls.static import static
from django.conf import settings
from . import views

urlpatterns = [
      path('api/user/get_friends/', views.GetFriendsView.as_view(), name='get_friends'),
      path('api/user/add_friend/', views.AddFriendView.as_view(), name='add_friend'),
]
