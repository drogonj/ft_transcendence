#!/bin/bash

pkill vault
rm -rf /vault/data/*

vault server -config=/vault/config/config.hcl &

sleep 5

if ! vault status >/dev/null 2>&1; then
    echo "Initializing Vault..."
    vault operator init -key-shares=1 -key-threshold=1 -format=json > /vault/data/init.json
    echo "Vault initialized"
fi

UNSEAL_KEY=$(jq -r '.unseal_keys_b64[0]' /vault/data/init.json)
ROOT_TOKEN=$(jq -r '.root_token' /vault/data/init.json)

echo "Unsealing Vault..."
vault operator unseal $UNSEAL_KEY

sealed=$(vault status -format=json | jq -r '.sealed')
if [ "$sealed" = "true" ]; then
    echo "Erreur : Vault est toujours scellé après tentative de déverrouillage"
    exit 1
fi

echo "Vault unsealed successfully"

export VAULT_TOKEN=$ROOT_TOKEN

if ! vault secrets list | grep -q '^secret/'; then
    echo "Enabling KV v2 secret engine at path 'secret/'"
    vault secrets enable -path=secret kv-v2
fi

vault kv put secret/myapp/database \
    DJANGO_KEY="$DJANGO_KEY" \
    DJANGO_SUPERUSER_USERNAME="$DJANGO_SUPERUSER_USERNAME" \
    DJANGO_SUPERUSER_PASSWORD="$DJANGO_SUPERUSER_PASSWORD" \
    DJANGO_SUPERUSER_EMAIL="$DJANGO_SUPERUSER_EMAIL" \
    POSTGRES_DB="$POSTGRES_DB" \
    POSTGRES_USER="$POSTGRES_USER" \
    POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    POSTGRES_HOST="$POSTGRES_HOST" \
    POSTGRES_PORT="$POSTGRES_PORT" \
    OAUTH_UID="$OAUTH_UID" \
    OAUTH_SECRET="$OAUTH_SECRET" \
    OAUTH_URI="$OAUTH_URI" \
    OAUTH_STATE="$OAUTH_STATE" \
    WEBSITE_URL="$WEBSITE_URL"

cat <<EOF > /vault/config/django-policy.hcl
path "secret/data/myapp/*" {
  capabilities = ["read"]
}
EOF

vault policy write django-policy /vault/config/django-policy.hcl
vault audit enable file file_path=/var/log/vault_audit.log
DJANGO_TOKEN=$(vault token create -policy=django-policy -format=json | jq -r '.auth.client_token')
echo "$DJANGO_TOKEN" > /vault/token/token
echo "Vault initialized and configured"
tail -f /dev/null
