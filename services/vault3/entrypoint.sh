#!/bin/sh
sleep 5
chown -R vault:vault /vault/token/

# Switch to the vault user and run the start script
exec su-exec vault /usr/local/bin/start-vault.sh
