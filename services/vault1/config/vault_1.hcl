storage "inmem" {}

listener "tcp" {
   address = "0.0.0.0:8200"
   tls_disable = true
}

ui = true
disable_mlock = true
api_addr = "http://vault_1:8200"