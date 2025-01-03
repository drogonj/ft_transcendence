#!/bin/bash

export VAULT_ADDR=https://vault_1:8200
export VAULT_CACERT=/vault/ssl/ca.crt

vault_to_network_address() {
  local vault_node_name=$1
  case $vault_node_name in
    vault_1) echo "https://vault_1:8200" ;;
    vault_2) echo "https://vault_2:8200" ;;
    vault_3) echo "https://vault_3:8200" ;;
    vault_4) echo "https://vault_4:8200" ;;
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

check_vault_status() {
  vault status -format=json 2>/dev/null
}

start_vault "vault_1"
sleep 5

if vault status -format=json | jq -e '.initialized == false' >/dev/null; then
  echo "Initializing Vault..."
  vault operator init -key-shares=1 -key-threshold=1 -format=json > /vault/token/init1.json
  chmod 600 /vault/token/init1.json
  echo "Extracting unseal key and root token..."
  UNSEAL_KEY=$(jq -r '.unseal_keys_b64[0]' /vault/token/init1.json)
  VAULT_TOKEN=$(jq -r '.root_token' /vault/token/init1.json)
  echo $VAULT_TOKEN > /vault/token/root_token-vault_1
  chmod 600 /vault/token/root_token-vault_1
  sleep 5
else
  echo "Vault is already initialized."
  if [ -f "/vault/token/init1.json" ]; then
    UNSEAL_KEY=$(jq -r '.unseal_keys_b64[0]' /vault/token/init1.json)
    VAULT_TOKEN=$(jq -r '.root_token' /vault/token/init1.json)
  else
    echo "Error: init1.json not found. Cannot retrieve unseal key and root token."
  fi
fi

if vault status -format=json 2>/dev/null | jq -e '.sealed == true' >/dev/null; then
  echo "Unsealing Vault..."
  vault operator unseal $UNSEAL_KEY
fi

export VAULT_TOKEN=$VAULT_TOKEN

sleep 3
if ! vault secrets list | grep -q '^transit/'; then
  echo "Enabling transit secrets engine..."
  vault secrets enable transit
else
  echo "Transit secrets engine is already enabled."
fi

if ! vault read transit/keys/unseal_key >/dev/null 2>&1; then
  echo "Creating unseal key for auto-unseal..."
  vault write -f transit/keys/unseal_key
else
  echo "Unseal key already exists."
fi

if ! vault policy read unseal_key >/dev/null 2>&1; then
  echo "Creating policy for auto-unseal..."
  vault policy write unseal_key - <<EOF
path "transit/encrypt/unseal_key" {
   capabilities = [ "update" ]
}

path "transit/decrypt/unseal_key" {
   capabilities = [ "update" ]
}
EOF
else
  echo "Unseal key policy already exists."
fi

if ! vault audit list | grep -q 'file/'; then
  echo "Enabling audit logging..."
  vault audit enable file file_path=/vault/logs/vault_audit.log
else
  echo "Audit logging is already enabled."
fi

echo "Setup complete."
tail -f /dev/null
