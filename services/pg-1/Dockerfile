FROM bitnami/postgresql-repmgr:14

EXPOSE 5432 

USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl jq && \
    apt-get clean

RUN mkdir -p /opt/bitnami/postgresql/logs && \
    chown 1001:1001 /opt/bitnami/postgresql/logs && \
    chmod 755 /opt/bitnami/postgresql/logs

COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

USER 1001

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]