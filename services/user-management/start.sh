#!/bin/sh

echo "Waiting for Vault 2 to be ready..."
while true; do
if curl -fs -o /dev/null --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/sys/health; then
    echo "Vault 2 is ready. Proceeding with startup."
    break
fi
echo "Vault 2 is not ready yet. Retrying in 10 seconds..."
sleep 10
done


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

echo "----- Starting Game Events Listener ----- "
python manage.py game_events_listener &

echo "-----------Run daphne server--------- "
daphne -b 0.0.0.0 -p 8000 user-management.asgi:application