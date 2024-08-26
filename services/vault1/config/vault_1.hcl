storage "raft" {
  path    = "/vault/data/vault_1"
  node_id = "vault_1"
  retry_join {
    leader_api_addr = "https://vault_2:8200"
  }
  retry_join {
    leader_api_addr = "https://vault_3:8200"
  }
  retry_join {
    leader_api_addr = "https://vault_4:8200"
  }
}

listener "tcp" {
  address = "0.0.0.0:8200"
  cluster_address = "vault_1:8201"
  tls_cert_file   = "/vault/ssl/vault_1-combined.crt"
  tls_key_file    = "/vault/ssl/vault_1.key"
  tls_client_ca_file = "/vault/ssl/ca.crt"
}

ui = true
disable_mlock = true
cluster_addr = "https://vault_1:8201"
api_addr = "https://vault_1:8200"
