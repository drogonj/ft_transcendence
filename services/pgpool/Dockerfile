FROM bitnami/pgpool:4

USER root

COPY ./pgpool.conf /opt/bitnami/pgpool/conf/transcendence_pgpool.conf
COPY ./failover_script.sh /opt/bitnami/scripts/failover_script.sh

RUN chown 1001:1001 /opt/bitnami/scripts/failover_script.sh && \
    chown 1001:1001 /opt/bitnami/scripts/failover_script.sh && \
    chmod +x /opt/bitnami/scripts/failover_script.sh

USER 1001
