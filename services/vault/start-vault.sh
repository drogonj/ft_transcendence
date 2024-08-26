#!/bin/bash

pkill vault
rm -rf /vault/data/*

set -e

DIR="/vault/ssl"
CA_KEY="${DIR}/ca.key"
CA_CERT="${DIR}/ca.crt"

mkdir -p "${DIR}"

# Générer la clé privée de la CA
openssl genpkey -algorithm RSA -out "${CA_KEY}" -aes256 -pass pass:mycapass

# Créer le certificat auto-signé de la CA
openssl req -x509 -new -nodes -key "${CA_KEY}" -sha256 -days 3650 -out "${CA_CERT}" -subj "/C=FR/ST=Alsace/L=Mulhouse/O=Transcendence CA/CN=Transcendence Root CA" -passin pass:mycapass

# Fonction pour générer les certificats pour un serveur Vault
generate_cert() {
  local SERVER_NAME=$1
  local IP1=$2
  local IP2=$3

  # Générer la clé privée du serveur
  openssl genpkey -algorithm RSA -out "${DIR}/${SERVER_NAME}.key"

  # Créer le fichier de configuration OpenSSL pour le serveur
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

  # Générer la CSR pour le serveur
  openssl req -new -key "${DIR}/${SERVER_NAME}.key" -out "${DIR}/${SERVER_NAME}.csr" -config "${DIR}/${SERVER_NAME}.cnf"

  # Signer la CSR avec la CA
  openssl x509 -req -in "${DIR}/${SERVER_NAME}.csr" -CA "${CA_CERT}" -CAkey "${CA_KEY}" -CAcreateserial -out "${DIR}/${SERVER_NAME}.crt" -days 365 -sha256 -extensions v3_req -extfile "${DIR}/${SERVER_NAME}.cnf" -passin pass:mycapass

  # Créer le certificat combiné pour le serveur
  cat "${DIR}/${SERVER_NAME}.crt" "${CA_CERT}" > "${DIR}/${SERVER_NAME}-combined.crt"
}

generate_cert "vault" "127.0.0.1" "0.0.0.0"

vault server -config=/vault/config/config.hcl &

sleep 5

if ! vault status >/dev/null 2>&1; then
    echo "Initializing Vault..."
    vault operator init -key-shares=1 -key-threshold=1 -format=json > /vault/data/init.json
    echo "Vault initialized"
fi

UNSEAL_KEY=$(jq -r '.unseal_keys_b64[0]' /vault/data/init.json)
ROOT_TOKEN=$(jq -r '.root_token' /vault/data/init.json)

echo "Unsealing Vault..."
vault operator unseal $UNSEAL_KEY

sealed=$(vault status -format=json | jq -r '.sealed')
if [ "$sealed" = "true" ]; then
    echo "Erreur : Vault est toujours scellé après tentative de déverrouillage"
    exit 1
fi

echo "Vault unsealed successfully"

export VAULT_TOKEN=$ROOT_TOKEN

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