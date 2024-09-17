FROM bitnami/pgpool:4

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl jq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY ./transcendence_pgpool.conf /opt/bitnami/pgpool/conf/transcendence_pgpool.conf
COPY ./pgpool.conf /opt/bitnami/pgpool/etc/pgpool.conf
COPY ./pool_hba.conf /opt/bitnami/pgpool/etc/pool_hba.conf
COPY ./failover_script.sh /opt/bitnami/scripts/failover_script.sh
COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh

RUN mkdir -p /var/run/pgpool && chown 1001:1001 /var/run/pgpool
RUN chown 1001:1001 /opt/bitnami/scripts/failover_script.sh && \
    chmod +x /opt/bitnami/scripts/failover_script.sh && \
    chmod +x /usr/local/bin/entrypoint.sh
RUN chown -R 1001:1001 /opt/bitnami/pgpool/etc


USER 1001

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
