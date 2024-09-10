#!/bin/bash

DIR="/vault/ssl"
mkdir -p "$DIR"

generate_ca() {
    if [ ! -f "$DIR/ca.key" ]; then
        openssl genrsa -out "$DIR/ca.key" 4096
        openssl req -x509 -new -nodes -key "$DIR/ca.key" -sha256 -days 1024 -out "$DIR/ca.crt" -subj "/C=FR/ST=Alsace/L=Mulhouse/O=Transcendence/CN=VaultCA"
    fi
}

generate_cert() {
    local SERVER_NAME=$1
    local IP1=$2
    local IP2=$3

    if [ ! -f "$DIR/${SERVER_NAME}.key" ]; then
        openssl genrsa -out "$DIR/${SERVER_NAME}.key" 4096
        cat > "$DIR/${SERVER_NAME}.cnf" <<EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = FR
ST = Alsace
L = Mulhouse
O = Transcendence
CN = ${SERVER_NAME}

[req_ext]
subjectAltName = @alt_names

[alt_names]
IP.1 = ${IP1}
IP.2 = ${IP2}
DNS.1 = ${SERVER_NAME}
DNS.2 = vault_1
DNS.3 = vault_2
DNS.4 = vault_3
DNS.5 = vault_4
DNS.6 = user-management
EOF

        openssl req -new -key "$DIR/${SERVER_NAME}.key" -out "$DIR/${SERVER_NAME}.csr" -config "$DIR/${SERVER_NAME}.cnf"
        openssl x509 -req -in "$DIR/${SERVER_NAME}.csr" -CA "$DIR/ca.crt" -CAkey "$DIR/ca.key" -CAcreateserial \
            -out "$DIR/${SERVER_NAME}.crt" -days 365 -sha256 -extfile "$DIR/${SERVER_NAME}.cnf" -extensions req_ext
        cat "$DIR/${SERVER_NAME}.crt" "$DIR/ca.crt" > "$DIR/${SERVER_NAME}-combined.crt"
        rm "$DIR/${SERVER_NAME}.csr" "$DIR/${SERVER_NAME}.cnf"
    fi
}

generate_ca
generate_cert "vault_1" "127.0.0.1" "0.0.0.0"
generate_cert "vault_2" "127.0.0.1" "0.0.0.0"
generate_cert "vault_3" "127.0.0.1" "0.0.0.0"
generate_cert "vault_4" "127.0.0.1" "0.0.0.0"

echo "All certificates generated successfully."
