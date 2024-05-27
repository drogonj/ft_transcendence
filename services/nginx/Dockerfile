FROM nginx:1.25.5-alpine
LABEL maintainer="jmathieu <jmathieu@student.42mulhouse.fr>"
LABEL version="0.1"
LABEL description="This is the base image for our Reverse proxy Nginx"
RUN apk update && apk upgrade && \
    apk add --no-cache nginx openssl python3 py3-pip py3-websockets
RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -out /etc/nginx/ssl/inception.crt \
    -keyout /etc/nginx/ssl/inception.key -subj "/C=FR/ST=GE/L=Mulhouse/O=42/OU=42/CN=localhost/UID=laTeam"
COPY ./conf/transcendance.conf /etc/nginx/conf.d/transcendance.conf
CMD ["nginx", "-g", "daemon off;"]