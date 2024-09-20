FROM alpine:latest

RUN apk add --no-cache curl jq openssl bash

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
