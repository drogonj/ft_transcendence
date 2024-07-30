#!/bin/bash
echo "----- wait user-management ------ "
while ! nc -z user-management 8000; do sleep 1; done
echo ""

echo "----- Collect static files ------ " 
python manage.py collectstatic --noinput
echo ""

echo "----------- Apply migration ----------- "
python manage.py makemigrations
echo ""

python manage.py migrate
echo ""

python manage.py showmigrations
echo ""

python manage.py showmigrations
echo "----------- Migration applied ----------- "
echo ""

echo "----------- Run daphne server ----------- "
daphne -b 0.0.0.0 -p 8001 chat.asgi:application
echo ""