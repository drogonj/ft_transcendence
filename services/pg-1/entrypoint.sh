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

SECRETS=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | jq -r '.data.data')

export POSTGRESQL_USERNAME=$(echo $SECRETS | jq -r '.POSTGRESQL_USERNAME')
export POSTGRESQL_PASSWORD=$(echo $SECRETS | jq -r '.POSTGRESQL_PASSWORD')
export POSTGRESQL_DATABASE=$(echo $SECRETS | jq -r '.POSTGRESQL_DATABASE')
export REPMGR_PASSWORD=$(echo $SECRETS | jq -r '.REPMGR_PASSWORD')

# Configurer pg_hba.conf
echo "host all all 0.0.0.0/0 md5" >> /opt/bitnami/postgresql/conf/pg_hba.conf

# Exécuter le script d'entrée original de l'image bitnami/postgresql-repmgr
exec /opt/bitnami/scripts/postgresql-repmgr/entrypoint.sh /opt/bitnami/scripts/postgresql-repmgr/run.sh