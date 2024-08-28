#!/bin/bash

wait_for_vault1() {
  echo "Waiting for Vault 1 to be ready..."
  while true; do
    if curl -fs -o /dev/null --cacert /vault/ssl/ca.crt https://vault_1:8200/v1/sys/health; then
      echo "Vault 1 is ready. Proceeding with startup."
      break
    fi
    echo "Vault 1 is not ready yet. Retrying in 10 seconds..."
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
  chmod 600 $vault_config_file $vault_log_file
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

generate_cert "vault_2" "127.0.0.1" "0.0.0.0"
export VAULT_CACERT=/vault/ssl/ca.crt
wait_for_vault1

start_vault "vault_2"

sleep 2

vault operator init -recovery-shares=1 -recovery-threshold=1 -format=json > /vault/token/init2.json
chmod 600 /vault/token/init2.json

sleep 2
# RECOVERY_KEY=$(jq -r '.recovery_keys_b64[0]' /vault/token/init2.json)
# echo $RECOVERY_KEY > /vault/token/recovery-key
VAULT_TOKEN=$(jq -r '.root_token' /vault/token/init2.json)
echo $VAULT_TOKEN > /vault/token/root_token-vault_2
chmod 600 /vault/token/root_token-vault_2

# echo "Recovery key: $RECOVERY_KEY"
echo "Root token: $VAULT_TOKEN"
export VAULT_TOKEN
echo "waiting Vault for login"
sleep 2
if ! vault secrets list | grep -q '^secret/'; then
    echo "Enabling KV v2 secret engine at path 'secret/'"
    vault secrets enable -path=secret kv-v2
fi

vault kv put secret/ft_transcendence/database \
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
path "secret/data/ft_transcendence/*" {
  capabilities = ["read"]
}
EOF

vault policy write django-policy /vault/config/django-policy.hcl
DJANGO_TOKEN=$(vault token create -policy=django-policy -format=json | jq -r '.auth.client_token')
echo "$DJANGO_TOKEN" > /vault/token/django-token
chmod 600 /vault/token/django-token /vault/config/django-policy.hcl
vault kv get secret/ft_transcendence/database
vault status
echo "Vault initialized and configured"
tail -f /dev/null

