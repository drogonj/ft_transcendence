"""
Django settings for chat project.

Generated by 'django-admin startproject' using Django 5.0.7.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.0/ref/settings/
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
BASE_DIR_ENV = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(os.path.join(BASE_DIR_ENV, '.env'))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('CHAT_KEY')
WEBSITE_URL = os.getenv('WEBSITE_URL')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

# Application definition

INSTALLED_APPS = [
	'daphne',
	'django.contrib.admin',
	'django.contrib.auth',
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.messages',
	'django.contrib.staticfiles',
	'csp',
	'webchat',
	'rest_framework',
]

MIDDLEWARE = [
	'django.middleware.security.SecurityMiddleware',
	'django.contrib.sessions.middleware.SessionMiddleware',
	'django.middleware.common.CommonMiddleware',
	'django.middleware.csrf.CsrfViewMiddleware',
	'django.contrib.auth.middleware.AuthenticationMiddleware',
	'django.contrib.messages.middleware.MessageMiddleware',
	'django.middleware.clickjacking.XFrameOptionsMiddleware',
	'csp.middleware.CSPMiddleware',
	'chat.middleware.InterceptMiddleware',
]

ROOT_URLCONF = 'chat.urls'

TEMPLATES_DIR = os.path.abspath(os.path.join(BASE_DIR, '../singlepageapp'))
TEMPLATES = [
	{
		'BACKEND': 'django.template.backends.django.DjangoTemplates',
		'DIRS': [TEMPLATES_DIR],
		'APP_DIRS': True,
		'OPTIONS': {
			'context_processors': [
				'django.template.context_processors.debug',
				'django.template.context_processors.request',
				'django.contrib.auth.context_processors.auth',
				'django.contrib.messages.context_processors.messages',
			],
		},
	},
]

WSGI_APPLICATION = 'chat.wsgi.application'

#ASGI APPS
ASGI_APPLICATION = "chat.asgi.application"
CHANNEL_LAYERS = {
	"default": {
		"BACKEND": "channels_redis.core.RedisChannelLayer",
		"CONFIG": {
			"hosts": [("redis", 6379)],
		},
	}
}

# REST_FRAMEWORK = {
# 	# Use Django's standard `django.contrib.auth` permissions,
# 	# or allow read-only access for unauthenticated users.
# 	'DEFAULT_PERMISSION_CLASSES': [
# 		'rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly'
# 	]
# }

CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'",)
CSP_IMG_SRC = ("'self'",)
CSP_CONNECT_SRC = (
	"'self'",  # Autoriser les connexions vers le même domaine
	f"ws://{WEBSITE_URL}",  # Autoriser les connexions WebSocket non sécurisées
	f"wss://{WEBSITE_URL}"  # Autoriser les connexions WebSocket sécurisées
)

# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
	"default": {
		"ENGINE": "django.db.backends.postgresql",
		"NAME": os.environ.get("POSTGRESQL_DATABASE"),
		"USER": os.environ.get("POSTGRESQL_USERNAME"),
		"PASSWORD": os.environ.get("POSTGRESQL_PASSWORD"),
		"HOST": os.environ.get("POSTGRESQL_HOST"),
		"PORT": os.environ.get("POSTGRESQL_PORT"),
	}
}

# Cache configuration
CACHES = {
	'default': {
		"BACKEND": "django.core.cache.backends.redis.RedisCache",
		'LOCATION': 'redis://redis:6379/1',
	}
}

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
	{
		'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
	},
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Europe/Paris'

USE_I18N = True

USE_TZ = True


# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

STATIC_URL = '/static/'
STATIC_ROOT = '/singlepageapp/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

CSRF_COOKIE_AGE = 86400
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
CORS_ALLOW_CREDENTIALS = True
LOGIN_RATELIMIT_USER = True

CSRF_TRUSTED_ORIGINS = [
	f"http://{WEBSITE_URL}",
	f"https://{WEBSITE_URL}"
]
CORS_ALLOWED_ORIGINS = [
	f"http://{WEBSITE_URL}",
	f"https://{WEBSITE_URL}"
]