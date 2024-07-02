#!/bin/bash

export VAULT_TOKEN=$(cat /shared/django_vault_token.env)
cat /shared/django_vault_token.env

echo "----- Collect static files ------ " 
python manage.py collectstatic --noinput

echo "-----------Apply migration--------- "
python manage.py makemigrations 
python manage.py migrate
python create_superuser.py

echo "-----------Run daphne server--------- "
daphne -b 0.0.0.0 -p 8000 user-management.asgi:application

