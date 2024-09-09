#!/bin/sh

#!/bin/sh

echo "Waiting for Vault 3 to be ready..."
while true; do
  echo "Attempting to connect to Vault 3..."
  if curl -v -fs --cacert /vault/ssl/ca.crt https://vault_3:8200/v1/sys/health; then
    echo "Vault 3 is ready. Proceeding with startup."
    break
  else
    echo "Curl exit code: $?"
    echo "Vault 3 is not ready yet. Retrying in 20 seconds..."
    sleep 20
  fi
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