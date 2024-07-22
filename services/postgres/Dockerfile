FROM postgres:16.3

ENV POSTGRES_USER=${SQL_USER}
ENV POSTGRES_PASSWORD=${SQL_PASSWORD}
ENV POSTGRES_DB=${SQL_DATABASE}

HEALTHCHECK --interval=5s --timeout=3s --retries=10 \
  CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB || exit 1

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y ssl-cert

COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf

RUN mkdir -p /etc/ssl/private/postgresql && \
    openssl req -new -x509 -days 365 -nodes -text -out /etc/ssl/certs/postgresql.crt \
    -keyout /etc/ssl/private/postgresql/postgresql.key -subj "/CN=postgres"

RUN chown -R postgres:postgres /etc/postgresql /etc/ssl/private/postgresql /etc/ssl/certs/postgresql.crt && \
    chmod 600 /etc/ssl/private/postgresql/postgresql.key

USER postgres

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]