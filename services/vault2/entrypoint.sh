#!/bin/sh
set -e

# chown -R vault:vault /vault/token/

# Switch to the vault user and run the start script with vault permission
exec su-exec vault /usr/local/bin/start-vault.sh