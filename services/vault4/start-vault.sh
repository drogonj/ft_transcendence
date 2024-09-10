#!/bin/bash

wait_for_vault1() {
  echo "Waiting for Vault 1 to be ready..."
  while true; do
    if curl -fs -o /dev/null --cacert /vault/ssl/ca.crt https://vault_1:8200/v1/sys/health; then
      echo "Vault 1 is ready. Proceeding with startup."
      break
    fi
    echo "Vault 1 is not ready yet. Retrying in 20 seconds..."
    sleep 20
  done
}
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

export VAULT_CACERT=/vault/ssl/ca.crt
wait_for_vault1
sleep 40
start_vault "vault_4"

echo "Waiting for Vault 4 to start and auto-unseal..."
for i in {1..5}; do
    if vault status -format=json 2>/dev/null | jq -e '.sealed==false' >/dev/null; then
        echo "Vault 4 is unsealed and ready."
        break
    fi
    if [ $i -eq 5 ]; then
        echo "Timeout waiting for Vault 4 to unseal. Please check logs and configuration."
        exit 1
    fi
    echo "Waiting for Vault 4 to unseal... Attempt $i/5"
    sleep 10
done

export VAULT_TOKEN=$(cat /vault/token/root_token-vault_2)

echo "Joining Raft cluster..."
for i in {1..5}; do
    if vault operator raft join https://vault_2:8200; then
        echo "Successfully joined the Raft cluster."
        break
    fi
    if [ $i -eq 5 ]; then
        echo "Failed to join Raft cluster after 5 attempts. Please check logs and configuration."
        exit 1
    fi
    echo "Failed to join Raft cluster. Retrying in 10 seconds... Attempt $i/5"
    sleep 10
done

echo "Verifying Vault 4 status..."
vault status

echo "Listing KV secrets..."
if vault kv list secret/; then
    echo "Successfully listed KV secrets."
else
    echo "Failed to list KV secrets. This might be normal if no secrets have been added yet."
fi

echo "Vault 4 setup complete."
tail -f /dev/null
