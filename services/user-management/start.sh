#!/bin/sh

while true; do
  if [ -f "/vault/token/django-token" ]; then
    VAULT_TOKEN=$(cat /vault/token/django-token)
      if curl -fs -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | grep -q '"data"'; then
      echo "Vault 2 is ready and secrets are configured. Proceeding with startup."
      break
    fi
  fi
done

VAULT_ADDR=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | jq -r '.data.data.VAULT_ADDR')
VAULT_TOKEN_FILE=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | jq -r '.data.data.VAULT_TOKEN_FILE')
VAULT_CA_CERT_PATH=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | jq -r '.data.data.VAULT_CA_CERT_PATH')
export VAULT_ADDR="$VAULT_ADDR"
export VAULT_TOKEN_FILE="$VAULT_TOKEN_FILE"
export VAULT_CA_CERT_PATH="$VAULT_CA_CERT_PATH"

echo "----------- wait pgpool ----------- "
while ! nc -z pgpool 5432; do sleep 5; done
echo ""

echo "----- Collect static files ------ " 
python manage.py collectstatic --noinput

echo "-----------Apply migration--------- "
python manage.py makemigrations
echo ""
python manage.py migrate
echo ""
python manage.py showmigrations
echo "----------- Migration applied ----------- "

if [ -f /user-management/configured ]; then
  echo "-----------Reset users status--------- "
  python reset_users_status.py
else
  python create_superuser.py
  python create_testusers.py
  touch /user-management/configured
fi

echo "----- Starting Game Events Listener ----- "
python manage.py game_events_listener &

echo "-----------Run daphne server--------- "
daphne -b 0.0.0.0 -p 8000 user-management.asgi:application
