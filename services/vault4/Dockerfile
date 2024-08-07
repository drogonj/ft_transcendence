FROM hashicorp/vault:latest

RUN apk add --no-cache bash curl openssl jq

RUN mkdir -p /vault/ssl /vault/config /vault/data/ /vault/logs /vault/plugins /vault/data/vault_4

COPY config/vault_4.hcl /vault/config/vault_4.hcl
COPY start-vault.sh /usr/local/bin/start-vault.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chown -R vault:vault /vault/
RUN chmod +x /usr/local/bin/start-vault.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]