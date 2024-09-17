from django.urls import path, re_path
from . import views

urlpatterns = [
    path('api/user/get_matches/<int:user_id>/', views.GetUserMatchesView.as_view(), name='get_matches'),
    path('api/user/statement/', views.user_statement_front.as_view(), name='user_statement'),
    path('backend/handle_game_events/', views.HandleGameEventsView.as_view(), name='handle_game_events'),
    path('backend/user_statement/', views.user_statement_back.as_view(), name='user_statement_back'),
]