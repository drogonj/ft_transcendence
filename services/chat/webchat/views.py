import requests, logging
from django.http import JsonResponse
from django.views import View

logger = logging.getLogger(__name__)

class FetchUserDataView(View):
    def get(self, request):
        try:
            response = requests.get('http://user-management:8000/api/user/get_users/')
            response.raise_for_status()

            data = response.json()
            return JsonResponse(data, safe=False)

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching user data: {e}")
            return JsonResponse({'error': str(e)}, status=500)