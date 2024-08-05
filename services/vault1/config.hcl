storage "raft" {
  path    = "/vault/data"
  node_id = "vault1"

  retry_join {
    leader_api_addr = "https://vault1:8200"
    leader_ca_cert_file = "/vault/certs/ca.pem"
    leader_client_cert_file = "/vault/certs/vault.pem"
    leader_client_key_file = "/vault/certs/vault.key"
  }
}

listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/vault/certs/vault.pem"
  tls_key_file  = "/vault/certs/vault.key"
  tls_disable_client_certs = true
}

api_addr = "https://vault1:8200"
cluster_addr = "https://vault1:8201"

disable_mlock = true
ui = true
