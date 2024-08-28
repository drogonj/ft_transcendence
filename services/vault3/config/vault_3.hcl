storage "raft" {
  path    = "/vault/data/vault_3"
  node_id = "vault_3"
  retry_join {
    leader_api_addr = "https://vault_2:8200"
    leader_ca_cert_file = "/vault/ssl/ca.crt"
    leader_client_cert_file = "/vault/ssl/vault_3-combined.crt"
    leader_client_key_file = "/vault/ssl/vault_3.key"
  }
  retry_join {
    leader_api_addr = "https://vault_4:8200"
    leader_ca_cert_file = "/vault/ssl/ca.crt"
    leader_client_cert_file = "/vault/ssl/vault_3-combined.crt"
    leader_client_key_file = "/vault/ssl/vault_3.key"
  }
}


listener "tcp" {
   address = "0.0.0.0:8200"
   cluster_address = "0.0.0.0:8201"
   tls_cert_file   = "/vault/ssl/vault_3-combined.crt"
   tls_key_file    = "/vault/ssl/vault_3.key"
   tls_client_ca_file = "/vault/ssl/ca.crt"
}

seal "transit" {
   address            = "https://vault_1:8200"
   # token is read from VAULT_TOKEN env
   # token              = ""
   disable_renewal    = "false"

   // Key configuration
   key_name           = "unseal_key"
   mount_path         = "transit/"
}

ui = true
disable_mlock = true
cluster_addr = "https://vault_3:8201"
api_addr = "https://vault_3:8200"
