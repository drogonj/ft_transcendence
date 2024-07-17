from django.shortcuts import render
from django.http import JsonResponse
import time


i = 0
def hello(request):
    global i
    i += 1
    if i == 1:
        time.sleep(5)
    return JsonResponse({"message": "Hello, world! " + str(i)})
