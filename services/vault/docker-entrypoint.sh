#!/usr/bin/dumb-init /bin/sh
set -e

# Note above that we run dumb-init as PID 1 in order to reap zombie processes
# as well as forward signals to all processes in its session. Normally, sh
# wouldn't do either of these functions so we'd leak zombies as well as do
# unclean termination of all our sub-processes.

# Exécuter le script de création de certificats
cd /vault && chmod +x create-cert.sh && /bin/sh create-cert.sh

# Configurer les permissions des certificats
chown -R vault:vault /vault/ssl && \
chmod 644 /vault/ssl/ca.crt /vault/ssl/vault.crt && \
chmod 600 /vault/ssl/vault.key

# Exporter les variables d'environnement pour les certificats
export VAULT_CACERT=/vault/ssl/ca.crt
export VAULT_CLIENT_CERT=/vault/ssl/vault.crt
export VAULT_CLIENT_KEY=/vault/ssl/vault.key

# Prevent core dumps
ulimit -c 0

# Custom condition added to skip the auto IP configuration.
# If VAULT_SKIP_IP_AUTO_CONFIG is set skip auto configuration and use only the config file.
# This change was made to allow full control over the config through volume mounts.
if [ -z "$VAULT_SKIP_IP_AUTO_CONFIG" ]; then
    # Allow setting VAULT_REDIRECT_ADDR and VAULT_CLUSTER_ADDR using an interface
    # name instead of an IP address. The interface name is specified using
    # VAULT_REDIRECT_INTERFACE and VAULT_CLUSTER_INTERFACE environment variables. If
    # VAULT_*_ADDR is also set, the resulting URI will combine the protocol and port
    # number with the IP of the named interface.
    get_addr () {
        local if_name=$1
        local uri_template=$2
        ip addr show dev $if_name | awk -v uri=$uri_template '/\s*inet\s/ { \
          ip=gensub(/(.+)\/.+/, "\\1", "g", $2); \
          print gensub(/^(.+:\/\/).+(:.+)$/, "\\1" ip "\\2", "g", uri); \
          exit}'
    }

    if [ -n "$VAULT_REDIRECT_INTERFACE" ]; then
        export VAULT_REDIRECT_ADDR=$(get_addr $VAULT_REDIRECT_INTERFACE ${VAULT_REDIRECT_ADDR:-"http://0.0.0.0:8200"})
        echo "Using $VAULT_REDIRECT_INTERFACE for VAULT_REDIRECT_ADDR: $VAULT_REDIRECT_ADDR"
    fi
    if [ -n "$VAULT_CLUSTER_INTERFACE" ]; then
        export VAULT_CLUSTER_ADDR=$(get_addr $VAULT_CLUSTER_INTERFACE ${VAULT_CLUSTER_ADDR:-"https://0.0.0.0:8201"})
        echo "Using $VAULT_CLUSTER_INTERFACE for VAULT_CLUSTER_ADDR: $VAULT_CLUSTER_ADDR"
    fi
fi

# VAULT_CONFIG_DIR isn't exposed as a volume but you can compose additional
# config files in there if you use this image as a base, or use
# VAULT_LOCAL_CONFIG below.
VAULT_CONFIG_DIR=/vault/config/

# You can also set the VAULT_LOCAL_CONFIG environment variable to pass some
# Vault configuration JSON without having to bind any volumes.
if [ -n "$VAULT_LOCAL_CONFIG" ]; then
    echo "$VAULT_LOCAL_CONFIG" > "$VAULT_CONFIG_DIR/local.json"
fi

# If the user is trying to run Vault directly with some arguments, then
# pass them to Vault.
if [ "${1:0:1}" = '-' ]; then
    set -- vault "$@"
fi

# Look for Vault subcommands.
if [ "$1" = 'server' ]; then
    shift
    set -- vault server \
        -config="$VAULT_CONFIG_DIR" \
        # Disabling dev options, since the container will run in server mode.
        #-dev-root-token-id="$VAULT_DEV_ROOT_TOKEN_ID" \
        #-dev-listen-address="${VAULT_DEV_LISTEN_ADDRESS:-"0.0.0.0:8200"}" \
        "$@"
elif [ "$1" = 'version' ]; then
    # This needs a special case because there's no help output.
    set -- vault "$@"
elif vault --help "$1" 2>&1 | grep -q "vault $1"; then
    # We can't use the return code to check for the existence of a subcommand, so
    # we have to use grep to look for a pattern in the help output.
    set -- vault "$@"
fi

# If we are running Vault, make sure it executes as the proper user.
if [ "$1" = 'vault' ]; then
    if [ -z "$SKIP_CHOWN" ]; then
        # If the config dir is bind mounted then chown it
        if [ "$(stat -c %u /vault/config)" != "$(id -u vault)" ]; then
            chown -R vault:vault /vault/config || echo "Could not chown /vault/config (may not have appropriate permissions)"
        fi

        # If the logs dir is bind mounted then chown it
        if [ "$(stat -c %u /vault/logs)" != "$(id -u vault)" ]; then
            chown -R vault:vault /vault/logs
        fi

        # If the file dir is bind mounted then chown it
        if [ "$(stat -c %u /vault/file)" != "$(id -u vault)" ]; then
            chown -R vault:vault /vault/file
        fi
    fi

    if [ -z "$SKIP_SETCAP" ]; then
        # Allow mlock to avoid swapping Vault memory to disk
        setcap cap_ipc_lock=+ep $(readlink -f $(which vault))

        # In the case vault has been started in a container without IPC_LOCK privileges
        if ! vault -version 1>/dev/null 2>/dev/null; then
            >&2 echo "Couldn't start vault with IPC_LOCK. Disabling IPC_LOCK, please use --cap-add IPC_LOCK"
            setcap cap_ipc_lock=-ep $(readlink -f $(which vault))
        fi
    fi

    if [ "$(id -u)" = '0' ]; then
      set -- su-exec vault "$@"
    fi
fi

# Initialize and unseal Vault if not already done
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

# Configure Vault
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

# Keep the container running
tail -f /dev/null

exec "$@"
