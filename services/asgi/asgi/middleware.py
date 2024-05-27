import logging

logger = logging.getLogger(__name__)

class InterceptMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log the request
        logger.info('Received request: %s %s', request.method, request.get_full_path())

        response = self.get_response(request)

        # Log the response
        logger.info('Sending response: %s', response.status_code)

        return response
