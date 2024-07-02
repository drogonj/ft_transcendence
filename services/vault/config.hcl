storage "postgresql" {
  connection_url = "postgres://${SQL_USER}:${SQL_PASSWORD}@postgres:5432/${SQL_DATABASE}?sslmode=disable"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

ui = true
disable_mlock = true
