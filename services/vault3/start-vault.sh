#!/bin/bash

wait_for_vault2() {
  echo "Waiting for Vault 2 to be ready..."
  while true; do
    if curl -fs -o /dev/null --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/sys/health; then
      echo "Vault 2 is ready. Proceeding with startup."
      break
    fi
    echo "Vault 2 is not ready yet. Retrying in 10 seconds..."
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

DIR="/vault/ssl"
CA_KEY="${DIR}/ca.key"
CA_CERT="${DIR}/ca.crt"

mkdir -p "${DIR}"

generate_cert() {
  local SERVER_NAME=$1
  local IP1=$2
  local IP2=$3

  if [ -f "${DIR}/${SERVER_NAME}-combined.crt" ] && [ -f "${DIR}/${SERVER_NAME}.key" ]; then
    echo "Certificates for ${SERVER_NAME} already exist. Skipping generation."
    return
  fi

  echo "Generating certificates for ${SERVER_NAME}..."

  # Générer la clé privée du serveur
  openssl genpkey -algorithm RSA -out "${DIR}/${SERVER_NAME}.key"

  cat > "${DIR}/${SERVER_NAME}.cnf" << EOF
[req]
default_bits = 4096
encrypt_key  = no
default_md   = sha256
prompt       = no
utf8         = yes
distinguished_name = req_distinguished_name
req_extensions     = v3_req
[req_distinguished_name]
C  = FR
ST = Alsace
L  = Mulhouse
O  = Transcendence
CN = ${SERVER_NAME}
[v3_req]
basicConstraints     = CA:FALSE
subjectKeyIdentifier = hash
keyUsage             = digitalSignature, keyEncipherment
extendedKeyUsage     = clientAuth, serverAuth
subjectAltName       = @alt_names
[alt_names]
IP.1  = ${IP1}
IP.2  = ${IP2}
DNS.1 = ${SERVER_NAME}
DNS.2 = vault_1
DNS.3 = vault_2
DNS.4 = vault_3
DNS.5 = vault_4
EOF

  # Générer la CSR pour le serveur
  openssl req -new -key "${DIR}/${SERVER_NAME}.key" -out "${DIR}/${SERVER_NAME}.csr" -config "${DIR}/${SERVER_NAME}.cnf"

  # Signer la CSR avec la CA
  openssl x509 -req -in "${DIR}/${SERVER_NAME}.csr" -CA "${CA_CERT}" -CAkey "${CA_KEY}" -CAcreateserial -out "${DIR}/${SERVER_NAME}.crt" -days 365 -sha256 -extensions v3_req -extfile "${DIR}/${SERVER_NAME}.cnf" -passin pass:mycapass

  cat "${DIR}/${SERVER_NAME}.crt" "${CA_CERT}" > "${DIR}/${SERVER_NAME}-combined.crt"

  rm "${DIR}/${SERVER_NAME}.csr" "${DIR}/${SERVER_NAME}.cnf"

  echo "Certificates for ${SERVER_NAME} generated successfully."
}

generate_cert "vault_3" "127.0.0.1" "0.0.0.0"
export VAULT_CACERT=/vault/ssl/ca.crt
wait_for_vault2
start_vault "vault_3"

echo "Waiting for Vault 3 to start and auto-unseal..."
for i in {1..30}; do
    if vault status -format=json 2>/dev/null | jq -e '.sealed==false' >/dev/null; then
        echo "Vault 3 is unsealed and ready."
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Timeout waiting for Vault 3 to unseal. Please check logs and configuration."
        exit 1
    fi
    echo "Waiting for Vault 3 to unseal... Attempt $i/30"
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

echo "Verifying Vault 3 status..."
vault status

echo "Listing KV secrets..."
if vault kv list secret/; then
    echo "Successfully listed KV secrets."
else
    echo "Failed to list KV secrets. This might be normal if no secrets have been added yet."
fi

echo "Vault 3 setup complete."
tail -f /dev/null
