FROM hashicorp/vault:latest

RUN apk add --no-cache bash curl openssl jq

RUN mkdir -p /vault/ssl /vault/config /vault/data/ /vault/logs /vault/plugins

COPY config/vault_1.hcl /vault/config/vault_1.hcl
COPY start-vault.sh /usr/local/bin/start-vault.sh
RUN chmod +x /usr/local/bin/start-vault.sh
RUN chown -R vault:vault /vault /vault/data
RUN chown -R vault:vault /vault/data

ENTRYPOINT ["/usr/local/bin/start-vault.sh"]