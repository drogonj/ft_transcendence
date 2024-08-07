storage "raft" {
   path    = "/vault/data/vault_3"
   node_id = "vault_3"
   retry_join {
      leader_api_addr = "http://vault_2:8200"
   }
   retry_join {
      leader_api_addr = "http://vault_4:8200"
   }
}

listener "tcp" {
   address = "0.0.0.0:8200"
   cluster_address = "vault_3:8201"
   tls_disable = true
}

seal "transit" {
   address            = "http://vault_1:8200"
   # token is read from VAULT_TOKEN env
   # token              = ""
   disable_renewal    = "false"

   // Key configuration
   key_name           = "unseal_key"
   mount_path         = "transit/"
}

ui = true
disable_mlock = true
cluster_addr = "http://vault_3:8201"
api_addr = "http://vault_3:8200"
