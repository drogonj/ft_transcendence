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
    SQL_DATABASE="$SQL_DATABASE" \
    SQL_USER="$SQL_USER" \
    SQL_PASSWORD="$SQL_PASSWORD" \
    SQL_HOST="$SQL_HOST" \
    SQL_PORT="$SQL_PORT" \
    42OAUTH_UID="$42OAUTH_UID" \
    42OAUTH_SECRET="$42OAUTH_SECRET" \
    42OAUTH_URI="$42OAUTH_URI" \
    42OAUTH_STATE="$42OAUTH_STATE" \
    WEBSITE_URL="$WEBSITE_URL"

cat <<EOF > /vault/config/django-policy.hcl
path "secret/data/myapp/*" {
  capabilities = ["read"]
}
EOF

vault kv get secret/myapp/database
vault policy write django-policy /vault/config/django-policy.hcl

DJANGO_TOKEN=$(vault token create -policy=django-policy -format=json | jq -r '.42Oauth.client_token')
echo "$DJANGO_TOKEN" > /shared/django_vault_token.env
vault token capabilities $DJANGO_TOKEN secret/data/myapp/database
vault token lookup $DJANGO_TOKEN
vault policy read django-policy
echo "Vault initialized and configured"
tail -f /dev/null
