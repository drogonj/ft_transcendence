#!/bin/bash

echo "Waiting for Vault 2 to be ready and configured..."
while true; do
  if [ -f "/vault/token/django-token" ]; then
    VAULT_TOKEN=$(cat /vault/token/django-token)
      if curl -fs -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | grep -q '"data"'; then
      echo "Vault 2 is ready and secrets are configured. Proceeding with startup."
      break
    fi
  fi
  sleep 10
done

sleep 30
VAULT_ADDR=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | jq -r '.data.data.VAULT_ADDR')
VAULT_TOKEN_FILE=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | jq -r '.data.data.VAULT_TOKEN_FILE')
VAULT_CA_CERT_PATH=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | jq -r '.data.data.VAULT_CA_CERT_PATH')
export VAULT_ADDR="$VAULT_ADDR"
export VAULT_TOKEN_FILE="$VAULT_TOKEN_FILE"
export VAULT_CA_CERT_PATH="$VAULT_CA_CERT_PATH"
echo "----------- wait user-management ----------- "
while ! nc -z user-management 8000; do sleep 5; done
echo ""

echo "----------- Collect static files ----------- " 
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