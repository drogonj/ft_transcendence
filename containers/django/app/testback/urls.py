from django.urls import path
from . import views

urlpatterns = [
	path("", views.ExampleView.as_view(), name="home"),
	path('receive-data/', views.receive_data, name='receive_data'),
]