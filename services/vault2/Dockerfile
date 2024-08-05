FROM hashicorp/vault:latest

RUN apk add --no-cache jq bash curl
EXPOSE 8200 8201 8202

# Copier les fichiers de configuration et le script de démarrage
COPY config.hcl /vault/config/config.hcl
COPY start-vault.sh /usr/local/bin/start-vault.sh
RUN mkdir -p vault/data

# Copier les certificats
COPY certs/ca.pem /vault/certs/ca.pem
COPY certs/vault2.pem /vault/certs/vault.pem
COPY certs/vault2.key /vault/certs/vault.key

# Définir les permissions appropriées
RUN chmod +x /usr/local/bin/start-vault.sh && \
    chmod 644 /vault/certs/ca.pem /vault/certs/vault.pem && \
    chmod 600 /vault/certs/vault.key

# Debug: Check if the file exists
RUN ls -l /usr/local/bin/start-vault.sh

ENTRYPOINT ["/usr/local/bin/start-vault.sh"]
