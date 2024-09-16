#!/bin/sh

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

while [ ! -d "/tmp_static/admin" ]
do
  echo waiting for django-statics...
  sleep 5
done

sleep 5

WEBSITE_HOSTNAME=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | jq -r '.data.data.WEBSITE_HOSTNAME')
WEBSITE_URL=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | jq -r '.data.data.WEBSITE_URL')
NGINX_CONF="/etc/nginx/conf.d/transcendence.conf"

if [ -z "$WEBSITE_HOSTNAME" -o -z "$WEBSITE_URL" ]; then
  echo "Error: WEBSITE_URL or WEBSITE_HOSTNAME not set."
  exit 1
fi

sed -i "s/website-hostname-template/$WEBSITE_HOSTNAME/g" "$NGINX_CONF"
sed -i "s/website-url-template/$WEBSITE_URL/g" "$NGINX_CONF"

cp -r /tmp_static/* /singlepageapp

nginx -g 'daemon off;'
