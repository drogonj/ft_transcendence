#!/bin/bash

vault_to_network_address() {
  local vault_node_name=$1
  case $vault_node_name in
    vault_1) echo "http://vault_1:8200" ;;
    vault_2) echo "http://vault_2:8200" ;;
    vault_3) echo "http://vault_3:8200" ;;
    vault_4) echo "http://vault_4:8200" ;;
    *) echo "Unknown vault node name: $vault_node_name" ;;
  esac
}

start_vault() {
  local vault_node_name=$1

  local vault_network_address
  vault_network_address=$(vault_to_network_address "$vault_node_name")
  local vault_config_file="/vault/config/$vault_node_name.hcl"
  local vault_log_file="/vault/logs/$vault_node_name.log"

  printf "\n%s" \
    "[$vault_node_name] starting Vault server @ $vault_network_address" \
    ""

  if [[ "$vault_node_name" != "vault_1" ]] ; then
    if [[ -e "/vault/token/root_token-vault_1" ]] ; then
      VAULT_TOKEN=$(cat "/vault/token/root_token-vault_1")

      printf "\n%s" \
        "Using [vault_1] root token ($VAULT_TOKEN) to retrieve transit key for auto-unseal"
      printf "\n"
    fi
  fi

  VAULT_TOKEN=$VAULT_TOKEN VAULT_API_ADDR=$vault_network_address vault server -log-level=trace -config "$vault_config_file" > "$vault_log_file" 2>&1 &
}

start_vault "vault_2"

sleep 3

vault operator init -recovery-shares=1 -recovery-threshold=1 -format=json > /vault/token/init2.json

RECOVERY_KEY=$(jq -r '.recovery_keys_b64[0]' /vault/token/init2.json)
echo $RECOVERY_KEY > /vault/token/recovery-key
ROOT_TOKEN=$(jq -r '.root_token' /vault/token/init2.json)
VAULT_TOKEN=$(jq -r '.root_token' /vault/token/init2.json)
echo $VAULT_TOKEN > /vault/token/root_token-vault_2

echo "Recovery key: $RECOVERY_KEY"
echo "Root token: $ROOT_TOKEN"
export VAULT_TOKEN
# vault login $ROOT_TOKEN
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
vault kv get secret/myapp/database
echo "Vault initialized and configured"
tail -f /dev/null

tail -f /dev/null
