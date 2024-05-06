FROM nginx:1.25.5-alpine

RUN apk add openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -out /etc/nginx/ssl/inception.crt -keyout /etc/nginx/ssl/inception.key -subj "/C=FR/ST=GUS/L=Mulhouse/O=42/OU=42/CN=localhost/UID=laTeam"

COPY ./conf/transcendance.conf /etc/nginx/conf.d/transcendance.conf

CMD ["nginx", "-g", "daemon off;"]