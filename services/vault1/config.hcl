storage "raft" {
  node_id = "raft_node_1"
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 0
  tls_cert_file = "/etc/ssl/certs/vault.crt"
  tls_key_file = "/etc/ssl/private/vault/vault.key"
}

api_addr = "http://vault1:8000"
cluster_addr = "http://vault1:8001"


ui = true
disable_mlock = true
