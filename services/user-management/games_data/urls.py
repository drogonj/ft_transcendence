from django.urls import path, re_path
from . import views

urlpatterns = [
    path('api/user/get_matches/<int:user_id>/', views.GetUserMatchesView.as_view(), name='get_matches'),
    path('backend/handle_game_events/', views.HandleGameEventsView.as_view(), name='handle_game_events'),
]