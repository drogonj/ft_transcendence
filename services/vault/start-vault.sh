#!/bin/bash

init_db() {
    echo "Initializing Vault database..."
    PGPASSWORD=$SQL_PASSWORD psql -h postgres -U $SQL_USER -d $SQL_DATABASE -f /vault/config/init-vault-db.sql
    echo "Vault database initialized."
}

# Fonction pour attendre que PostgreSQL soit prêt
wait_for_postgres() {
    echo "Waiting for PostgreSQL to start..."
    until PGPASSWORD=$SQL_PASSWORD psql -h postgres -U $SQL_USER -d $SQL_DATABASE -c '\q' 2>/dev/null; do
        echo "PostgreSQL is unavailable - sleeping"
        sleep 1
    done
    echo "PostgreSQL is up and running"
}

# Attendre que PostgreSQL soit prêt
wait_for_postgres

# Vérifier si les tables Vault existent déjà
if ! PGPASSWORD=$SQL_PASSWORD psql -h postgres -U $SQL_USER -d $SQL_DATABASE -c "SELECT 1 FROM vault_kv_store LIMIT 1" &>/dev/null; then
    echo "Vault tables do not exist. Creating them..."
    init_db
else
    echo "Vault tables already exist."
fi

# Remplacer les variables d'environnement dans le fichier de configuration
sed -i "s/\${SQL_USER}/$SQL_USER/g" /vault/config/config.hcl
sed -i "s/\${SQL_PASSWORD}/$SQL_PASSWORD/g" /vault/config/config.hcl
sed -i "s/\${SQL_DATABASE}/$SQL_DATABASE/g" /vault/config/config.hcl

# Démarrer Vault
vault server -config=/vault/config/config.hcl &


vault operator init -key-shares=1 -key-threshold=1 -format=json > /vault/data/init.json


# Déverrouiller Vault
UNSEAL_KEY=$(jq -r '.unseal_keys_b64[0]' /vault/data/init.json)
vault operator unseal $UNSEAL_KEY

# Configurer Vault
export VAULT_TOKEN=$(jq -r '.root_token' /vault/data/init.json)

if ! vault secrets list | grep -q '^secret/'; then
    echo "Enabling KV v2 secret engine at path 'secret/'"
    vault secrets enable -path=secret kv-v2
fi

vault kv put secret/myapp/database \
    database="${SQL_DATABASE}" \
    username="${SQL_USER}" \
    password="${SQL_PASSWORD}"

echo "Vault initialized and configured"

# Garder le conteneur en vie
tail -f /dev/null
