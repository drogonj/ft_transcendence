"""
Django settings for user-management project.

Generated by 'django-admin startproject' using Django 5.0.6.

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
SECRET_KEY = os.getenv('DJANGO_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
    '*',
]

AUTH_USER_MODEL = "authentication.Account"

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'csp',
    'daphne',
    'channels',
    'django.contrib.staticfiles',
    'rest_framework',
    'authentication',
    'friends',
]

AUTHENTICATION_BACKENDS = (
    'authentication.authentication_backends.EmailOrUsernameModelBackend',
    'django.contrib.auth.backends.ModelBackend',
)

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'csp.middleware.CSPMiddleware',
    'user-management.middleware.InterceptMiddleware',
]

ROOT_URLCONF = 'user-management.urls'

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

WSGI_APPLICATION = 'user-management.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": os.environ.get("SQL_ENGINE", "django.db.backends.postgresql_psycopg2"),
        "NAME": os.environ.get("SQL_DATABASE"),        
        "USER": os.environ.get("SQL_USER"),
        "PASSWORD": os.environ.get("SQL_PASSWORD"),
        "HOST": os.environ.get("SQL_HOST"),
        "PORT": os.environ.get("SQL_PORT"),
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

#ASGI APPS
ASGI_APPLICATION = 'user-management.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',  # Pour un usage local simple
    },
}

CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'",)
CSP_IMG_SRC = ("'self'",)
CSP_CONNECT_SRC = ("'self'", "ws://localhost:8080", "wss://localhost:8080")


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

STATIC_URL = '/static/'
STATIC_ROOT = '/singlepageapp/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/login/'

CSRF_COOKIE_AGE = 86400
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
CORS_ALLOW_CREDENTIALS = True
LOGIN_RATELIMIT_USER = True

CSRF_TRUSTED_ORIGINS = [
    'https://127.0.0.1:8080',
    'https://localhost:8080',
]
CORS_ALLOWED_ORIGINS = [
    'https://127.0.0.1:8080',
    'https://localhost:8080',
]


