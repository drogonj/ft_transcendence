#!/bin/bash

export VAULT_ADDR=https://vault_2:8200
export VAULT_CACERT=/vault/ssl/ca.crt

wait_for_vault1() {
  echo "Waiting for Vault 1 to be ready..."
  while true; do
    if curl -fs -o /dev/null --cacert /vault/ssl/ca.crt https://vault_1:8200/v1/sys/health; then
      echo "Vault 1 is ready. Proceeding with startup."
      break
    fi
    sleep 10
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

check_raft_status() {
  vault operator raft list-peers >/dev/null 2>&1
  return $?
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
  chmod 600 $vault_config_file $vault_log_file
}

wait_for_vault1
start_vault "vault_2"
sleep 5

if [ ! -f "/vault/token/init2.json" ]; then
    echo "Initializing Vault..."
    vault operator init -recovery-shares=1 -recovery-threshold=1 -format=json > /vault/token/init2.json
    chmod 600 /vault/token/init2.json
    VAULT_TOKEN=$(jq -r '.root_token' /vault/token/init2.json)
    echo $VAULT_TOKEN > /vault/token/root_token-vault_2
    chmod 600 /vault/token/root_token-vault_2
    echo "Root token: $VAULT_TOKEN"
    export VAULT_TOKEN=$VAULT_TOKEN
    echo "Waiting for Vault to be ready..."
    while ! vault status >/dev/null 2>&1; do
        echo "Vault is not ready yet. Waiting..."
        sleep 5
    done
    echo "Vault is ready!"
else
    echo "Vault already initialized. Using existing root token."
    VAULT_TOKEN=$(cat /vault/token/root_token-vault_2)
    export VAULT_TOKEN=$VAULT_TOKEN
    echo "Waiting for Raft cluster to stabilize..."
    for i in {1..10}; do
        if check_raft_status; then
            echo "Raft cluster is stable."
            break
        fi
        if [ $i -eq 10 ]; then
            echo "Timeout waiting for Raft cluster to stabilize. Proceeding anyway."
        fi
        sleep 10
    done
fi

if ! vault secrets list | grep -q '^secret/'; then
    echo "Enabling KV v2 secret engine at path 'secret/'"
    vault secrets enable -path=secret kv-v2
else
    echo "KV v2 secret engine already enabled at path 'secret/'"
fi

if ! vault policy read django-policy >/dev/null 2>&1; then
    echo "Creating Django policy..."
    cat <<EOF > /vault/config/django-policy.hcl
path "secret/data/ft_transcendence/*" {
  capabilities = ["read"]
}
EOF
    vault policy write django-policy /vault/config/django-policy.hcl
    chmod 600 /vault/config/django-policy.hcl
else
    echo "Django policy already exists."
fi

if [ ! -f "/vault/token/django-token" ]; then
    echo "Creating new Django token..."
    DJANGO_TOKEN=$(vault token create -policy=django-policy -format=json | jq -r '.auth.client_token')
    echo "$DJANGO_TOKEN" > /vault/token/django-token
    chmod 600 /vault/token/django-token
else
    echo "Django token already exists."
fi

echo "Verifying secrets..."
vault kv get secret/ft_transcendence/database

echo "Vault status:"
vault status

echo "Vault initialized and configured"
tail -f /dev/null