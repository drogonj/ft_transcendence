#!/bin/bash

# Créer les répertoires pour les certificats si ils n'existent pas
mkdir -p services/vault1/certs services/vault2/certs services/vault3/certs

# Générer la clé privée de la CA
openssl genrsa -out services/vault1/certs/ca.key 4096

# Générer le certificat auto-signé de la CA
openssl req -x509 -new -nodes -key services/vault1/certs/ca.key -sha256 -days 1825 -out services/vault1/certs/ca.pem -subj "/CN=Vault CA"

# Copier le certificat CA dans les autres dossiers
cp services/vault1/certs/ca.pem services/vault2/certs/
cp services/vault1/certs/ca.pem services/vault3/certs/

# Fonction pour générer un certificat pour un nœud
generate_node_cert() {
    NODE=$1
    DIR="services/${NODE}/certs"
    openssl genrsa -out ${DIR}/${NODE}.key 2048
    openssl req -new -key ${DIR}/${NODE}.key -out ${DIR}/${NODE}.csr -subj "/CN=${NODE}"
    openssl x509 -req -in ${DIR}/${NODE}.csr -CA services/vault1/certs/ca.pem -CAkey services/vault1/certs/ca.key -CAcreateserial -out ${DIR}/${NODE}.pem -days 825 -sha256 -extfile <(printf "subjectAltName=DNS:${NODE},DNS:vault,IP:127.0.0.1")
    rm ${DIR}/${NODE}.csr
}

# Générer des certificats pour chaque nœud
generate_node_cert vault1
generate_node_cert vault2
generate_node_cert vault3

echo "Certificats générés et placés dans les dossiers appropriés."
