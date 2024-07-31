FROM hashicorp/vault:latest

RUN apk add --no-cache bash curl openssl jq
RUN mkdir -p /etc/ssl/private/vault && \
    openssl req -out /etc/ssl/certs/vault.crt -new -keyout /etc/ssl/private/vault/vault.key -newkey rsa:4096 -nodes -sha256 -x509 -subj "/CN=vault1" -addext "subjectAltName = IP:0.0.0.0,DNS:localhost,DNS:vault1" -days 3650 && \
    touch /var/log/vault_audit.log
COPY config.hcl /vault/config/config.hcl
COPY start-vault.sh /usr/local/bin/start-vault.sh
RUN mkdir -p /vault/data && chown -R vault:vault /vault/data
RUN chmod +x /usr/local/bin/start-vault.sh
RUN chown -R vault:vault /vault/data /etc/ssl/private/vault /etc/ssl/certs/vault.crt && \
    chmod 600 /etc/ssl/private/vault/vault.key
ENTRYPOINT ["/usr/local/bin/start-vault.sh"]
