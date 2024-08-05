storage "file" {
    path = "/vault/file"
}

listener "tcp" {
    address       = "0.0.0.0:8200"
    tls_cert_file = "/vault/ssl/vault-combined.crt"
    tls_key_file  = "/vault/ssl/vault.key"
    tls_client_ca_file = "vault/ssl/ca.crt"
}


api_addr = "https://vault:8200"
cluster_addr = "https://vault:8201"

ui = true

plugin_directory = "/vault/plugins"
log_level = "debug"

default_lease_ttl = "168h"
max_lease_ttl = "720h"