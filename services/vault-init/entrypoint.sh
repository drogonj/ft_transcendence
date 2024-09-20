#!/bin/sh

VAULT_ADDR=https://vault_2:8200
VAULT_CACERT=/vault/ssl/ca.crt

wait_for_vault() {
    until curl -fs -o /dev/null --cacert $VAULT_CACERT $VAULT_ADDR/v1/sys/health; do
        sleep 5
    done
    echo "Vault is ready."
}

get_root_token() {
    if [ -f "/vault/token/root_token-vault_2" ]; then
        cat /vault/token/root_token-vault_2
    else
        echo "Root token not found. Exiting." >&2
        exit 1
    fi
}

setup_secrets() {
    VAULT_TOKEN=$(get_root_token)
    
    if ! curl -s --cacert $VAULT_CACERT -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_ADDR/v1/sys/mounts | jq -e '.data."secret/"' > /dev/null 2>&1; then
        curl -s -o /dev/null --cacert $VAULT_CACERT -H "X-Vault-Token: $VAULT_TOKEN" -X POST -d '{"type":"kv-v2"}' $VAULT_ADDR/v1/sys/mounts/secret
    fi

    curl -s -o /dev/null --cacert $VAULT_CACERT -H "X-Vault-Token: $VAULT_TOKEN" -X POST -d "{
        \"data\": {
            \"DJANGO_KEY\": \"$DJANGO_KEY\",
            \"DJANGO_SUPERUSER_USERNAME\": \"$DJANGO_SUPERUSER_USERNAME\",
            \"DJANGO_SUPERUSER_PASSWORD\": \"$DJANGO_SUPERUSER_PASSWORD\",
            \"DJANGO_SUPERUSER_EMAIL\": \"$DJANGO_SUPERUSER_EMAIL\",
            \"CHAT_KEY\": \"$CHAT_KEY\",
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
    echo "Secrets setup completed."
}

enable_kv_v2() {
    VAULT_TOKEN=$(get_root_token)
    
    if curl -s --cacert $VAULT_CACERT -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_ADDR/v1/sys/mounts | jq -e '.data."secret/" == null' > /dev/null; then
        curl -s -o /dev/null --cacert $VAULT_CACERT -H "X-Vault-Token: $VAULT_TOKEN" -X POST -d '{"type":"kv", "options": {"version": "2"}}' $VAULT_ADDR/v1/sys/mounts/secret
        echo "KV v2 secrets engine enabled at path 'secret'"
    else
        echo "KV secrets engine already exists at path 'secret'"
    fi
}

setup_django_policy() {
    VAULT_TOKEN=$(get_root_token)

    curl -s -o /dev/null --cacert $VAULT_CACERT -H "X-Vault-Token: $VAULT_TOKEN" -X PUT -d '{
        "policy": "path \"secret/data/ft_transcendence/*\" { capabilities = [\"read\"] }"
    }' $VAULT_ADDR/v1/sys/policies/acl/django-policy

    DJANGO_TOKEN=$(curl -s --cacert $VAULT_CACERT -H "X-Vault-Token: $VAULT_TOKEN" -X POST -d '{
        "policies": ["django-policy"]
    }' $VAULT_ADDR/v1/auth/token/create | jq -r '.auth.client_token')

    echo "$DJANGO_TOKEN" > /vault/token/django-token
    chmod 600 /vault/token/django-token
    chmod +r /vault/token/django-token
    echo "Django policy setup completed."
}

wait_for_vault
enable_kv_v2
setup_secrets
setup_django_policy

echo "Initialization complete. Exiting."
