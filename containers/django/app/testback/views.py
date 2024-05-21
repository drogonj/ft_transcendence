import django.views.debug
from django.shortcuts import render
from django.views import generic
from .models import Example
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
from django.core.exceptions import ValidationError


class ExampleView(generic.TemplateView):
    template_name = "index.html"
    print("call")


@csrf_exempt
@require_POST
def receive_data(request):
    try:
        data = json.loads(request.body)
        pseudo = data.get('pseudo')
        level = data.get('level')
        elo = data.get('elo')

        if Example.objects.filter(pseudo=pseudo).exists():
            raise ValidationError("User name already use")
        Example(pseudo=pseudo, level=level, elo=elo).save()

        return JsonResponse({'status': 'success', 'message': 'Data received successfully'})
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except ValidationError as e:
        return JsonResponse({'status': 'error', 'message': 'Validation error', 'errors': str(e)}, status=400)
