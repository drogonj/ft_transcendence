storage "raft" {
  node_id = "raft_node_1"
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 0
  tls_cert_file = "/etc/ssl/certs/vault.crt"
  tls_key_file = "/etc/ssl/private/vault/vault.key"
  tls_disable_client_certs = "true"
}

api_addr = "https://vault:8200"
cluster_addr = "https://vault:8201"

ui = true
disable_mlock = true
