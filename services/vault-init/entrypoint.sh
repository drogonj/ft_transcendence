#!/bin/sh

VAULT_ADDR=https://vault_2:8200
VAULT_CACERT=/vault/ssl/ca.crt

wait_for_vault() {
    echo "Waiting for Vault to be ready..."
    until curl -fs -o /dev/null --cacert $VAULT_CACERT $VAULT_ADDR/v1/sys/health; do
        sleep 5
    done
    echo "Vault is ready."
}

get_root_token() {
    if [ -f "/vault/token/root_token-vault_2" ]; then
        cat /vault/token/root_token-vault_2
    else
        echo "Root token not found. Exiting."
        exit 1
    fi
}

setup_secrets() {
    VAULT_TOKEN=$(get_root_token)
    
    # Enable KV secrets engine if not already enabled
    if ! curl -s --cacert $VAULT_CACERT -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_ADDR/v1/sys/mounts | jq -e '.data."secret/"'; then
        curl -s --cacert $VAULT_CACERT -H "X-Vault-Token: $VAULT_TOKEN" -X POST -d '{"type":"kv-v2"}' $VAULT_ADDR/v1/sys/mounts/secret
    fi

    # Insert secrets
    curl -s --cacert $VAULT_CACERT -H "X-Vault-Token: $VAULT_TOKEN" -X POST -d "{
        \"data\": {
            \"PORT_CONTAINER\": \"$PORT_CONTAINER\",
            \"PORT\": \"$PORT\",
            \"DJANGO_KEY\": \"$DJANGO_KEY\",
            \"DJANGO_SUPERUSER_USERNAME\": \"$DJANGO_SUPERUSER_USERNAME\",
            \"DJANGO_SUPERUSER_PASSWORD\": \"$DJANGO_SUPERUSER_PASSWORD\",
            \"DJANGO_SUPERUSER_EMAIL\": \"$DJANGO_SUPERUSER_EMAIL\",
            \"CHAT_KEY\": \"$CHAT_KEY\",
            \"SQL_ENGINE\": \"$SQL_ENGINE\",
            \"PGPOOL_BACKEND_NODES\": \"$PGPOOL_BACKEND_NODES\",
            \"PGPOOL_ENABLE_LDAP\": \"$PGPOOL_ENABLE_LDAP\",
            \"PGPOOL_ADMIN_USERNAME\": \"$PGPOOL_ADMIN_USERNAME\",
            \"PGPOOL_ADMIN_PASSWORD\": \"$PGPOOL_ADMIN_PASSWORD\",
            \"PGPOOL_USER_CONF_FILE\": \"$PGPOOL_USER_CONF_FILE\",
            \"POSTGRESQL_USERNAME\": \"$POSTGRESQL_USERNAME\",
            \"POSTGRESQL_PASSWORD\": \"$POSTGRESQL_PASSWORD\",
            \"POSTGRESQL_DATABASE\": \"$POSTGRESQL_DATABASE\",
            \"POSTGRESQL_HOST\": \"$POSTGRESQL_HOST\",
            \"POSTGRESQL_PORT\": \"$POSTGRESQL_PORT\",
            \"REPMGR_PASSWORD\": \"$REPMGR_PASSWORD\",
            \"VAULT_TOKEN_FILE\": \"$VAULT_TOKEN_FILE\",
            \"VAULT_ADDR\": \"$VAULT_ADDR\",
            \"VAULT_CA_CERT_PATH\": \"$VAULT_CA_CERT_PATH\",
            \"VAULT_CACERT\": \"$VAULT_CACERT\",
            \"OAUTH_UID\": \"$OAUTH_UID\",
            \"OAUTH_SECRET\": \"$OAUTH_SECRET\",
            \"OAUTH_STATE\": \"$OAUTH_STATE\",
            \"OAUTH_URI\": \"$OAUTH_URI\",
            \"WEBSITE_HOSTNAME\": \"$WEBSITE_HOSTNAME\",
            \"WEBSITE_URL\": \"$WEBSITE_URL\"
        }
    }" $VAULT_ADDR/v1/secret/data/ft_transcendence/database
}


setup_django_policy() {
    VAULT_TOKEN=$(get_root_token)

    curl -s --cacert $VAULT_CACERT -H "X-Vault-Token: $VAULT_TOKEN" -X PUT -d '{
        "policy": "path \"secret/data/ft_transcendence/*\" { capabilities = [\"read\"] }"
    }' $VAULT_ADDR/v1/sys/policies/acl/django-policy

    DJANGO_TOKEN=$(curl -s --cacert $VAULT_CACERT -H "X-Vault-Token: $VAULT_TOKEN" -X POST -d '{
        "policies": ["django-policy"]
    }' $VAULT_ADDR/v1/auth/token/create | jq -r '.auth.client_token')

    echo "$DJANGO_TOKEN" > /vault/token/django-token
    chmod 600 /vault/token/django-token
}

wait_for_vault
setup_secrets
setup_django_policy

echo "Initialization complete. Exiting."
