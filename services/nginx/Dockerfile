FROM nginx:1.25.5-alpine
LABEL maintainer="jmathieu <jmathieu@student.42mulhouse.fr>"
LABEL version="0.1"
LABEL description="This is the base image for our Reverse proxy Nginx"
RUN apk update && apk upgrade && \
    apk add --no-cache nginx openssl python3 py3-pip py3-websockets && \
	mkdir -p /etc/nginx/ssl /var/www/html && \
	openssl req -x509 -nodes -out /etc/nginx/ssl/transcendence.crt \
    -keyout /etc/nginx/ssl/transcendence.key -subj \
	"/C=FR/ST=GE/L=Mulhouse/O=42/OU=42/CN=localhost/UID=laTeam"
COPY ./conf/transcendence.conf /etc/nginx/conf.d/default.conf
COPY ./html/index.html /var/www/html/index.html
CMD ["nginx", "-g", "daemon off;"]