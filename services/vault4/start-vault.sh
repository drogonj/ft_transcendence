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

start_vault "vault_4"
sleep 3

export VAULT_TOKEN=$(cat /vault/token/root_token-vault_2)
echo "Joining Raft cluster..."
vault operator raft join http://vault_2:8200
sleep 3
vault status
echo "Vault 4 setup complete."
tail -f /dev/null
