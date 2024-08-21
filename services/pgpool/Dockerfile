FROM bitnami/pgpool:4

USER root

COPY ./pgpool.conf /opt/bitnami/pgpool/conf/transcendence_pgpool.conf
COPY ./failover_script.sh /opt/bitnami/scripts/failover_script.sh

RUN chmod +r /opt/bitnami/pgpool/conf/transcendence_pgpool.conf && \
    chmod +x /opt/bitnami/scripts/failover_script.sh
