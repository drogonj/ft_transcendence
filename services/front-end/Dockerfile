FROM nginx:1.25.5-alpine
LABEL maintainer="jmathieu <jmathieu@student.42mulhouse.fr>"
LABEL version="0.1"
LABEL description="This is the base image for our Reverse proxy Nginx"

RUN apk update && apk upgrade && \
    apk add --no-cache nginx openssl python3 py3-pip py3-websockets && \
    mkdir -p /etc/nginx/ssl /var/www/transcendence && \
    openssl req -x509 -nodes -out /etc/nginx/ssl/inception.crt \
    -keyout /etc/nginx/ssl/inception.key -subj \
	"/C=FR/ST=GE/L=Mulhouse/O=42/OU=42/CN=localhost/UID=laTeam"

COPY ./entrypoint.sh /
RUN chmod +x ./entrypoint.sh

COPY ./conf/transcendence.conf /etc/nginx/conf.d/transcendence.conf
COPY ./static /singlepageapp
