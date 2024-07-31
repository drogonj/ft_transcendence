FROM hashicorp/vault:latest

RUN apk add --no-cache bash curl jq
RUN    touch /var/log/vault_audit.log
COPY config.hcl /vault/config/config.hcl
COPY start-vault.sh /usr/local/bin/start-vault.sh
RUN mkdir -p /vault/data && chown -R vault:vault /vault/data
RUN chmod +x /usr/local/bin/start-vault.sh
RUN chown -R vault:vault /vault/data
ENTRYPOINT ["/usr/local/bin/start-vault.sh"]
