from django.shortcuts import render
from django.views import generic
from .models import Example


class ExampleView(generic.TemplateView):
    template_name = "index.html"
    print("call")
