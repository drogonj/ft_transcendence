#!/bin/bash
# Démarrer Vault
vault server -config=/vault/config/config.hcl &

# Attendre que Vault démarre
sleep 10

export VAULT_ADDR='https://127.0.0.1:8200'
export VAULT_CACERT='/vault/certs/ca.pem'
export VAULT_SKIP_VERIFY=true

# Attendre que Vault1 soit prêt
until curl -s -o /dev/null -w "%{http_code}" https://vault1:8200/v1/sys/health --cacert $VAULT_CACERT --insecure | grep "200" > /dev/null; do
    echo "Waiting for vault1..."
    sleep 5
done

# Joindre le cluster si ce n'est pas déjà fait
if ! vault operator raft list-peers | grep -q "vault2"; then
    echo "Joining Raft cluster..."
    vault operator raft join -tls-skip-verify https://vault1:8200
fi

# Vérifier si Vault est déjà initialisé
if vault status 2>&1 | grep -q "Vault is sealed"; then
    echo "Vault is sealed. Unsealing..."
    if [ -f /vault/data/init.json ]; then
        UNSEAL_KEY=$(jq -r '.unseal_keys_b64[0]' /vault/data/init.json)
        vault operator unseal $UNSEAL_KEY
    else
        echo "Error: init.json not found. Cannot unseal Vault."
        exit 1
    fi
elif ! vault status > /dev/null 2>&1; then
    echo "Error: Vault is not initialized. This should not happen for secondary nodes."
    exit 1
else
    echo "Vault is already initialized and unsealed."
fi

# Vérifier le statut de Vault
vault status

# Garder le conteneur en vie
tail -f /dev/null
