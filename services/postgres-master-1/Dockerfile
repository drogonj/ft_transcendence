FROM postgres:16.3

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y ssl-cert

COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf

RUN mkdir -p /etc/ssl/private/postgresql && \
    openssl req -new -x509 -days 365 -nodes -text -out /etc/ssl/certs/postgresql.crt \
    -keyout /etc/ssl/private/postgresql/postgresql.key -subj "/CN=postgres"

RUN chown -R postgres:postgres /etc/postgresql /etc/ssl/private/postgresql /etc/ssl/certs/postgresql.crt && \
    chmod 600 /etc/ssl/private/postgresql/postgresql.key && \
    chmod 640 /etc/postgresql/postgresql.conf && \
    chmod 640 /etc/postgresql/pg_hba.conf

USER postgres

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]