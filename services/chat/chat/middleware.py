from django.utils.deprecation import MiddlewareMixin

class CSPMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        response['Content-Security-Policy'] = "connect-src 'self' ws://localhost:8080"
        return response