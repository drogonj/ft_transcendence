#!/bin/bash

wait_for_vault1() {
  echo "Waiting for Vault 1 to be ready..."
  while true; do
    if curl -fs -o /dev/null --cacert /vault/ssl/ca.crt https://vault_1:8200/v1/sys/health; then
      echo "Vault 1 is ready. Proceeding with startup."
      break
    fi
    sleep 10
  done
  sleep 2
}

wait_for_vault2() {
  echo "Waiting for Vault 2 to be ready and configured..."
  for i in {1..60}; do 
    if curl -fs -o /dev/null --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/sys/health && \
       VAULT_TOKEN=$(cat /vault/token/root_token-vault_2) vault status -ca-cert=/vault/ssl/ca.crt >/dev/null 2>&1 && \
       VAULT_TOKEN=$(cat /vault/token/root_token-vault_2) vault kv get -format=json -ca-cert=/vault/ssl/ca.crt secret/ft_transcendence/database >/dev/null 2>&1; then
      echo "Vault 2 is ready and secrets are configured. Proceeding with startup."
      return 0
    fi
    sleep 5
  done
  echo "Timeout waiting for Vault 2. Proceeding anyway."
  return 1
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
start_vault "vault_4"
echo "Waiting for Vault 4 to start and auto-unseal..."
for i in {1..100}; do
    if vault status -format=json 2>/dev/null | jq -e '.sealed==false' >/dev/null; then
        echo "Vault 4 is unsealed and ready."
        break
    fi
    if [ $i -eq 10 ]; then
        echo "Timeout waiting for Vault 4 to unseal. Please check logs and configuration."
    fi
    # echo "Waiting for Vault 4 to unseal... Attempt $i/10"
    sleep 10
done

while [ ! -f /vault/token/root_token-vault_2 ]; do
  sleep 5
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
    fi
    # echo "Failed to join Raft cluster. Retrying in 10 seconds... Attempt $i/5"
    sleep 10
done

wait_for_vault2

check_kv_engine_ready() {
    vault kv list secret/ &>/dev/null
    return $?
}

echo "Waiting for KV secrets engine to be ready..."
for attempt in {1..10}; do
    if check_kv_engine_ready; then
        echo "KV secrets engine is ready."
        break
    else
        # echo "KV secrets engine not ready yet. Attempt $attempt/10"
        sleep 5
    fi
done

echo "Verifying Vault 4 status..."
vault status

echo "Listing KV secrets..."
if vault kv list secret/; then
    echo "Successfully listed KV secrets."
else
    echo "Failed to list KV secrets. This might be normal if no secrets have been added yet."
fi

vault operator raft list-peers
echo "Vault 4 setup complete."
tail -f /dev/null
