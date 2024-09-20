FROM hashicorp/vault:latest

RUN apk add --no-cache bash curl openssl jq su-exec

RUN mkdir -p /vault/ssl /vault/config /vault/data/ /vault/logs /vault/plugins /vault/data/vault_1

COPY config/vault_1.hcl /vault/config/vault_1.hcl
COPY start-vault.sh /usr/local/bin/start-vault.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

COPY generate_certs.sh /usr/local/bin/generate_certs.sh

RUN chown -R vault:vault /vault/ && \
    chmod +x /usr/local/bin/start-vault.sh /usr/local/bin/entrypoint.sh /usr/local/bin/generate_certs.sh

RUN /usr/local/bin/generate_certs.sh && rm /usr/local/bin/generate_certs.sh 
RUN chown -R vault:vault /vault/ssl && \
    chmod 600 /vault/ssl/*.key && \
    chmod 644 /vault/ssl/*.crt

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
