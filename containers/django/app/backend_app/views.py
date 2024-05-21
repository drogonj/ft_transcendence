import django.views.debug
from django.shortcuts import render
from django.views import generic


class DefaultView(generic.TemplateView):
    template_name = "index.html"
