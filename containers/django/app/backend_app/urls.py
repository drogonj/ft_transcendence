from django.urls import path
from . import views

urlpatterns = [
	path("", views.DefaultView.as_view(), name="home"),
]