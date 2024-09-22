#!/bin/bash

while true; do
  if [ -f "/vault/token/django-token" ]; then
    VAULT_TOKEN=$(cat /vault/token/django-token)
    if curl -fs -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | grep -q '"data"'; then
      echo "Vault 2 is ready and secrets are configured. Proceeding with startup."
      break
    fi
  fi
  sleep 10
done

sleep 20
SECRETS=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | jq -r '.data.data')

export PGPOOL_POSTGRES_USERNAME=$(echo $SECRETS | jq -r '.POSTGRESQL_USERNAME')
export PGPOOL_POSTGRES_PASSWORD=$(echo $SECRETS | jq -r '.POSTGRESQL_PASSWORD')
export PGPOOL_SR_CHECK_USER=$(echo $SECRETS | jq -r '.POSTGRESQL_USERNAME')
export PGPOOL_SR_CHECK_PASSWORD=$(echo $SECRETS | jq -r '.POSTGRESQL_PASSWORD')
export PGPOOL_SR_CHECK_DATABASE=$(echo $SECRETS | jq -r '.POSTGRESQL_DATABASE')
export PGPOOL_ADMIN_USERNAME=$(echo $SECRETS | jq -r '.PGPOOL_ADMIN_USERNAME')
export PGPOOL_ADMIN_PASSWORD=$(echo $SECRETS | jq -r '.PGPOOL_ADMIN_PASSWORD')
export PGPOOL_BACKEND_NODES="0:pg-0:5432,1:pg-1:5432"
export PGPOOL_USER_CONF_FILE="/opt/bitnami/pgpool/conf/transcendence_pgpool.conf"

echo "${PGPOOL_POSTGRES_USERNAME}:$(pg_md5 ${PGPOOL_POSTGRES_PASSWORD})" > /opt/bitnami/pgpool/etc/pool_passwd

#STILL HAVE AN ERROR (?) :
# pgpool                 | 2024-09-19 22:40:37.339: sr_check_worker pid 274: ERROR:  Failed to check replication time lag
# pgpool                 | 2024-09-19 22:40:37.339: sr_check_worker pid 274: DETAIL:  No persistent db connection for the node 1
# pgpool                 | 2024-09-19 22:40:37.339: sr_check_worker pid 274: HINT:  check sr_check_user and sr_check_password
# pgpool                 | 2024-09-19 22:40:37.339: sr_check_worker pid 274: CONTEXT:  while checking replication time lag
sed -i "s/^sr_check_user.*/sr_check_user = '${PGPOOL_SR_CHECK_USER}'/" /opt/bitnami/pgpool/conf/transcendence_pgpool.conf
sed -i "s/^sr_check_password.*/sr_check_password = '${PGPOOL_SR_CHECK_PASSWORD}'/" /opt/bitnami/pgpool/conf/transcendence_pgpool.conf
sed -i "s/^health_check_user.*/health_check_user = '${PGPOOL_POSTGRES_USERNAME}'/" /opt/bitnami/pgpool/conf/transcendence_pgpool.conf
sed -i "s/^health_check_password.*/health_check_password = '${PGPOOL_POSTGRES_PASSWORD}'/" /opt/bitnami/pgpool/conf/transcendence_pgpool.conf

/opt/bitnami/scripts/pgpool/setup.sh

exec /opt/bitnami/scripts/pgpool/run.sh
