#!/bin/sh

echo "----- Collect static files ------ " 
python manage.py collectstatic --noinput

echo "-----------Apply migration--------- "
python manage.py makemigrations
echo ""
python manage.py migrate
echo ""
python manage.py showmigrations
echo "----------- Migration applied ----------- "
python create_superuser.py
python create_testusers.py

echo "-----------Run daphne server--------- "
daphne -b 0.0.0.0 -p 8000 user-management.asgi:application