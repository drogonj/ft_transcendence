#!/bin/bash
pkill vault
rm -rf /vault/data/*

# Démarrer Vault
vault server -config=/vault/config/config.hcl &

# Attendre que Vault démarre
sleep 10

export VAULT_ADDR='https://127.0.0.1:8200'
export VAULT_CACERT='/vault/certs/ca.pem'
export VAULT_SKIP_VERIFY=true

# Initialiser Vault si ce n'est pas déjà fait
if ! vault status > /dev/null 2>&1; then
    echo "Initializing Vault..."
    vault operator init -key-shares=1 -key-threshold=1 -format=json > /vault/data/init.json
fi

# Déverrouiller Vault
if vault status | grep -q "Sealed: true"; then
    echo "Unsealing Vault..."
    UNSEAL_KEY=$(jq -r '.unseal_keys_b64[0]' /vault/data/init.json)
    vault operator unseal $UNSEAL_KEY
fi

# Vérifier le statut de Vault
vault status

# Garder le conteneur en vie
tail -f /dev/null
