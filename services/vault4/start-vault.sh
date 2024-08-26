#!/bin/bash

wait_for_vault2() {
  echo "Waiting for Vault 2 to be ready..."
  while true; do
    if curl -fs -o /dev/null --cacert /vault/ssl/ca.crt https://vault_1:8200/v1/sys/health; then
      echo "Vault 2 is ready. Proceeding with startup."
      break
    fi
    echo "Vault 2 is not ready yet. Retrying in 5 seconds..."
    sleep 5
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
EOF

  openssl req -new -key "${DIR}/${SERVER_NAME}.key" -out "${DIR}/${SERVER_NAME}.csr" -config "${DIR}/${SERVER_NAME}.cnf"

  openssl x509 -req -in "${DIR}/${SERVER_NAME}.csr" -CA "${CA_CERT}" -CAkey "${CA_KEY}" -CAcreateserial -out "${DIR}/${SERVER_NAME}.crt" -days 365 -sha256 -extensions v3_req -extfile "${DIR}/${SERVER_NAME}.cnf" -passin pass:mycapass

  cat "${DIR}/${SERVER_NAME}.crt" "${CA_CERT}" > "${DIR}/${SERVER_NAME}-combined.crt"
}

generate_cert "vault_4" "127.0.0.1" "0.0.0.0"
export VAULT_CACERT=/vault/ssl/ca.crt
wait_for_vault2
start_vault "vault_4"
sleep 3

export VAULT_TOKEN=$(cat /vault/token/root_token-vault_2)
echo "Joining Raft cluster..."
vault operator raft join https://vault_2:8200
sleep 3
vault status
echo "Vault 4 setup complete."
tail -f /dev/null
