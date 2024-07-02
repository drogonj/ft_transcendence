FROM hashicorp/vault:latest

RUN apk add --no-cache bash curl jq postgresql-client

COPY config.hcl /vault/config/config.hcl
COPY start-vault.sh /usr/local/bin/start-vault.sh
COPY init-vault-db.sql /vault/config/init-vault-db.sql
RUN mkdir -p /vault/data/ && touch /vault/data/init.json
RUN chmod +x /usr/local/bin/start-vault.sh

ENTRYPOINT ["/usr/local/bin/start-vault.sh"]
