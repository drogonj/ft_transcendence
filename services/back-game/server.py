import os
import django
from django.core.wsgi import get_wsgi_application
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import FallbackHandler, RequestHandler, Application
from tornado.wsgi import WSGIContainer
from tornado import gen

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backgame.settings')
django.setup()

print("DJANGO_SETTINGS_MODULE:", os.getenv('DJANGO_SETTINGS_MODULE'))

# Define a simple Tornado handler
i = 0
class HelloHandler(RequestHandler):
    async def get(self):
        global i
        i += 1
        print(f"Handling request {i}")
        if i == 1:
            await gen.sleep(5)  # Asynchronous sleep for 5 seconds
        self.write(f"Hello from Tornado! {i}")

# WSGI container for Django
django_app = WSGIContainer(get_wsgi_application())

# Tornado application
tornado_app = Application([
    (r"/hello-tornado", HelloHandler),  # Tornado-specific handler
    (r".*", FallbackHandler, dict(fallback=django_app)),  # Fallback to Django
])

if __name__ == "__main__":
    server = HTTPServer(tornado_app)
    server.listen(8000)
    print("Starting Tornado server on http://localhost:8000")
    IOLoop.current().start()