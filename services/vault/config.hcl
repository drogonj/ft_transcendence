storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 0
  tls_cert_file = "/vault/ssl/vault-combined.crt"
  tls_key_file = "/vault/ssl/vault.key"
}

api_addr = "https://vault:8200"

ui = true
disable_mlock = true
