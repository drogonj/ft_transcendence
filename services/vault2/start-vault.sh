#!/bin/bash

# Démarrer le serveur Vault
vault server -config=/vault/config/config.hcl &

sleep 5

# Récupérer la clé de déverrouillage du premier nœud
UNSEAL_KEY=$(jq -r '.unseal_keys_b64[0]' /vault/data/init.json)

echo "Unsealing Vault..."
vault operator unseal $UNSEAL_KEY

sealed=$(vault status -format=json | jq -r '.sealed')
if [ "$sealed" = "true" ]; then
    echo "Erreur : Vault est toujours scellé après tentative de déverrouillage"
    exit 1
fi

echo "Vault unsealed successfully"

# Joindre le cluster Raft
ROOT_TOKEN=$(jq -r '.root_token' /vault/data/init.json)
export VAULT_TOKEN=$ROOT_TOKEN

# Remplacez <LEADER_API_ADDR> par l'adresse API du nœud leader (le premier nœud)
vault operator raft join https://vault1:8000

echo "Vault node joined the cluster"
tail -f /dev/null
