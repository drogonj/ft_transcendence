#!/bin/bash

pkill vault
rm -rf /vault/data/*
rm -rf /vault/token/*

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

start_vault "vault_1"

echo "Waiting for Vault server to start..."
sleep 2

echo "Initializing Vault..."
vault operator init -key-shares=1 -key-threshold=1 -format=json > /vault/token/init1.json
chmod 600 /vault/token/init1.json

echo "Extracting unseal key and root token..."
UNSEAL_KEY=$(jq -r '.unseal_keys_b64[0]' /vault/token/init1.json)
VAULT_TOKEN=$(jq -r '.root_token' /vault/token/init1.json)
echo $VAULT_TOKEN > /vault/token/root_token-vault_1
chmod 600 /vault/token/root_token-vault_1

echo "Unsealing Vault..."
vault operator unseal $UNSEAL_KEY

echo "Logging in with root token..."
vault login $VAULT_TOKEN

echo "Enabling transit secrets engine..."
vault secrets enable transit

echo "Creating unseal key for auto-unseal..."
vault write -f transit/keys/unseal_key
echo "Creating policy for auto-unseal..."
vault policy write unseal_key - <<EOF
path "transit/encrypt/unseal_key" {
   capabilities = [ "update" ]
}

path "transit/decrypt/unseal_key" {
   capabilities = [ "update" ]
}
EOF
vault audit enable file file_path=/vault/logs/vault_audit.log
echo "Creating token with unseal policy..."
vault token create -policy="unseal_key" -orphan -period=24h -format=json > /vault/token/unseal_token
chmod 600 /vault/token/unseal_token /vault/logs/vault_audit.log
UNSEAL_TOKEN=$(jq -r '.auth.client_token' /vault/token/unseal_token)
echo $UNSEAL_TOKEN > /vault/token/unseal_token
echo "Setup complete. Keeping the container running..."
tail -f /dev/null
