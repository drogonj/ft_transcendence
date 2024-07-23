#!/bin/bash

# echo "----------- Apply migration ----------- "
# python manage.py makemigrations --merge
# echo ""
# python manage.py migrate
# echo ""
# python manage.py showmigrations
# echo "----------- Migration applied ----------- "
# echo ""

echo "----------- Run daphne server ----------- "
daphne -b 0.0.0.0 -p 8001 chat.asgi:application
echo ""