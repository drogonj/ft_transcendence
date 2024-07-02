storage "postgresql" {
  connection_url = "postgres://${VAULT_DB_USER}:${VAULT_DB_PASSWORD}@postgres:5432/${VAULT_DB_NAME}?sslmode=disable"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

ui = true
disable_mlock = true

