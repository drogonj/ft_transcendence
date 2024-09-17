#!/bin/bash

echo "Waiting for Vault 2 to be ready and configured..."
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

VAULT_TOKEN=$(cat /vault/token/django-token)

SECRETS=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" --cacert /vault/ssl/ca.crt https://vault_2:8200/v1/secret/data/ft_transcendence/database | jq -r '.data.data')

export PGPOOL_POSTGRES_USERNAME=$(echo $SECRETS | jq -r '.POSTGRESQL_USERNAME')
export PGPOOL_POSTGRES_PASSWORD=$(echo $SECRETS | jq -r '.POSTGRESQL_PASSWORD')
export PGPOOL_SR_CHECK_USER=$(echo $SECRETS | jq -r '.POSTGRESQL_USERNAME')
export PGPOOL_SR_CHECK_PASSWORD=$(echo $SECRETS | jq -r '.POSTGRESQL_PASSWORD')
export PGPOOL_SR_CHECK_DATABASE=$(echo $SECRETS | jq -r '.POSTGRESQL_DATABASE')

echo "PGPOOL_POSTGRES_USERNAME: $PGPOOL_POSTGRES_USERNAME"
echo "PGPOOL_SR_CHECK_USER: $PGPOOL_SR_CHECK_USER"
echo "PGPOOL_SR_CHECK_DATABASE: $PGPOOL_SR_CHECK_DATABASE"

echo "${PGPOOL_POSTGRES_USERNAME}:$(pg_md5 ${PGPOOL_POSTGRES_PASSWORD})" > /opt/bitnami/pgpool/etc/pool_passwd
cat /opt/bitnami/pgpool/etc/pool_passwd

sed -i "s/^sr_check_user.*/sr_check_user = '${PGPOOL_SR_CHECK_USER}'/" /opt/bitnami/pgpool/etc/pgpool.conf
sed -i "s/^sr_check_password.*/sr_check_password = '${PGPOOL_SR_CHECK_PASSWORD}'/" /opt/bitnami/pgpool/etc/pgpool.conf
sed -i "s/^health_check_user.*/health_check_user = '${PGPOOL_POSTGRES_USERNAME}'/" /opt/bitnami/pgpool/etc/pgpool.conf
sed -i "s/^health_check_password.*/health_check_password = '${PGPOOL_POSTGRES_PASSWORD}'/" /opt/bitnami/pgpool/etc/pgpool.conf

grep "sr_check_user" /opt/bitnami/pgpool/etc/pgpool.conf
grep "sr_check_password" /opt/bitnami/pgpool/etc/pgpool.conf
grep "health_check_user" /opt/bitnami/pgpool/etc/pgpool.conf
grep "health_check_password" /opt/bitnami/pgpool/etc/pgpool.conf

cat /opt/bitnami/pgpool/etc/pool_hba.conf
sed -i 's/^debug_level.*/debug_level = 5/' /opt/bitnami/pgpool/etc/pgpool.conf
PGPASSWORD=$PGPOOL_POSTGRES_PASSWORD psql -h pg-0 -U $PGPOOL_POSTGRES_USERNAME -d $PGPOOL_SR_CHECK_DATABASE -c "SELECT 1"
PGPASSWORD=$PGPOOL_POSTGRES_PASSWORD psql -h pg-1 -U $PGPOOL_POSTGRES_USERNAME -d $PGPOOL_SR_CHECK_DATABASE -c "SELECT 1"

pgpool -n -d -f /opt/bitnami/pgpool/etc/pgpool.conf
tail -f /var/log/pgpool/pgpool.log
