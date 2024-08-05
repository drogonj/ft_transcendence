#!/bin/sh

set -eu pipefail

IP1="192.168.65.12"
IP2="127.0.0.1"

DNS1="vault"
DNS2="localhost"

DIR="/vault/ssl"

# Supprimer le contenu du répertoire sans supprimer le répertoire lui-même
rm -rf ${DIR}/*

mkdir -p "${DIR}"

# Create the conf file
cat > "${DIR}/openssl.cnf" << EOF
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
ST = ALSACE
L  = Mulhouse
O  = localhost
CN = vault
[v3_req]
basicConstraints     = CA:FALSE
subjectKeyIdentifier = hash
keyUsage             = digitalSignature, keyEncipherment
extendedKeyUsage     = clientAuth, serverAuth
subjectAltName       = @alt_names
[alt_names]
IP.1  = ${IP1}
IP.2  = ${IP2}
DNS.1 = ${DNS1}
DNS.2 = ${DNS2}
EOF

# Generate Vault's certificates and a CSR
openssl genrsa -out "${DIR}/vault.key" 4096

openssl req \
  -new -key "${DIR}/vault.key" \
  -out "${DIR}/vault.csr" \
  -config "${DIR}/openssl.cnf"

# Create our CA
openssl req \
  -new \
  -newkey rsa:4096 \
  -days 3660 \
  -nodes \
  -x509 \
  -subj "/C=FR/ST=PARIS/L=Mulhouse/O=Vault CA" \
  -keyout "${DIR}/ca.key" \
  -out "${DIR}/ca.crt"

# Sign CSR with our CA
openssl x509 \
  -req \
  -days 365 \
  -in "${DIR}/vault.csr" \
  -CA "${DIR}/ca.crt" \
  -CAkey "${DIR}/ca.key" \
  -CAcreateserial \
  -extensions v3_req \
  -extfile "${DIR}/openssl.cnf" \
  -out "${DIR}/vault.crt"

# Export combined certs for vault
cat "${DIR}/vault.crt" "${DIR}/ca.crt" > "${DIR}/vault-combined.crt"
