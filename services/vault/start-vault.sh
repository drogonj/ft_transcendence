#!/bin/bash

wait_for_postgres() {
    echo "Waiting for PostgreSQL to start..."
    until PGPASSWORD=$SQL_PASSWORD psql -h postgres -U $SQL_USER -d postgres -c '\q' 2>/dev/null; do
        echo "PostgreSQL is unavailable - sleeping"
        sleep 1
    done
    echo "PostgreSQL is up and running"
}

create_vault_user() {
    echo "Creating Vault user in PostgreSQL..."
    PGPASSWORD=$SQL_PASSWORD psql -h postgres -U $SQL_USER -d postgres <<-EOSQL
    DO
    \$do\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$VAULT_DB_USER') THEN
            CREATE USER $VAULT_DB_USER WITH PASSWORD '$VAULT_DB_PASSWORD';
        END IF;
    END
    \$do\$;
    ALTER USER $VAULT_DB_USER CREATEDB;
EOSQL
    echo "Vault user created or updated."
}

init_vault_db() {
    echo "Initializing Vault database..."
    PGPASSWORD=$VAULT_DB_PASSWORD psql -h postgres -U $VAULT_DB_USER -d postgres <<-EOSQL
    CREATE DATABASE $VAULT_DB_NAME;
EOSQL
    PGPASSWORD=$VAULT_DB_PASSWORD psql -h postgres -U $VAULT_DB_USER -d $VAULT_DB_NAME -f /vault/config/init-vault-db.sql
    echo "Vault database initialized."
}

wait_for_postgres

create_vault_user

if ! PGPASSWORD=$VAULT_DB_PASSWORD psql -h postgres -U $VAULT_DB_USER -d postgres -lqt | cut -d \| -f 1 | grep -qw $VAULT_DB_NAME; then
    echo "Vault database does not exist. Creating it..."
    init_vault_db
else
    echo "Vault database already exists."
fi

sed -i "s/\${VAULT_DB_USER}/$VAULT_DB_USER/g" /vault/config/config.hcl
sed -i "s/\${VAULT_DB_PASSWORD}/$VAULT_DB_PASSWORD/g" /vault/config/config.hcl
sed -i "s/\${VAULT_DB_NAME}/$VAULT_DB_NAME/g" /vault/config/config.hcl

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
    database="${SQL_DATABASE}" \
    username="${SQL_USER}" \
    password="${SQL_PASSWORD}"

cat <<EOF > /vault/config/django-policy.hcl
path "secret/data/myapp/*" {
  capabilities = ["read"]
}
EOF

vault kv get secret/myapp/database
vault policy write django-policy /vault/config/django-policy.hcl

DJANGO_TOKEN=$(vault token create -policy=django-policy -format=json | jq -r '.auth.client_token')
echo "$DJANGO_TOKEN" > /shared/django_vault_token.env
vault token capabilities $DJANGO_TOKEN secret/data/myapp/database
vault token lookup $DJANGO_TOKEN
vault policy read django-policy
echo "Vault initialized and configured"
tail -f /dev/null
# Stocker les informations de la base de données de l'application dans
