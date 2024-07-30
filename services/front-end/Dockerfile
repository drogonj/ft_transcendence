FROM nginx:1.25.5-alpine
LABEL maintainer="jmathieu <jmathieu@student.42mulhouse.fr>"
LABEL version="0.1"
LABEL description="This is the base image for our Reverse proxy Nginx"

RUN apk update && apk upgrade && \
    apk add --no-cache openssl python3 py3-pip py3-websockets && \
    mkdir -p /etc/nginx/ssl /var/www/transcendence && \
    openssl req -x509 -nodes -out /etc/nginx/ssl/inception.crt \
    -keyout /etc/nginx/ssl/inception.key -subj \
    "/C=FR/ST=GE/L=Mulhouse/O=42/OU=42/CN=localhost/UID=laTeam" && \
    apk add --no-cache libtool autoconf build-base pcre-dev zlib-dev openssl-dev libxml2-dev geoip-dev lmdb-dev yajl-dev curl-dev pcre2-dev pkgconf libxslt-dev gd-dev automake git linux-headers

RUN cd /opt && \
    git clone --depth 100 -b v3/master --single-branch https://github.com/SpiderLabs/ModSecurity && \
    cd ModSecurity && \
    git submodule init && \
    git submodule update && \
    sh build.sh && \
    ./configure && \
    make && \
    make install && \
    mkdir /etc/nginx/modsec && \
    mv modsecurity.conf-recommended /etc/nginx/modsec/modsecurity.conf && \
    cp unicode.mapping /etc/nginx/modsec/ && \
    sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' /etc/nginx/modsec/modsecurity.conf && \
    sed -i 's/\/var\/log\/modsec_audit.log/\/var\/log\/nginx\/modsec_audit.log/g' /etc/nginx/modsec/modsecurity.conf && \
    #Include OWASP rules to ModSec
    git clone https://github.com/SpiderLabs/owasp-modsecurity-crs.git /etc/nginx/modsec/owasp-crs && \
    mv /etc/nginx/modsec/owasp-crs/crs-setup.conf.example /etc/nginx/modsec/owasp-crs/crs-setup.conf && \
    echo "Include owasp-crs/crs-setup.conf" >> /etc/nginx/modsec/modsecurity.conf && \
    echo "Include owasp-crs/rules/*.conf" >> /etc/nginx/modsec/modsecurity.conf

RUN mkdir /opt/cpg && \
    cd /opt/cpg && \
    wget http://nginx.org/download/nginx-1.25.5.tar.gz && \
    tar -xvzf nginx-1.25.5.tar.gz && \
    git clone https://github.com/SpiderLabs/ModSecurity-nginx && \
    cd nginx-1.25.5 && \
    ./configure --user=nginx --group=nginx --with-compat --with-http_ssl_module --with-http_realip_module --with-pcre-jit --add-dynamic-module=../ModSecurity-nginx --with-debug && \
    make modules && \
    cp objs/ngx_http_modsecurity_module.so /usr/lib/nginx/modules/ && \
    cd .. && \
    rm -rf ModSecurity-nginx nginx-1.25.5 nginx-1.25.5.tar.gz

COPY ./entrypoint.sh /
RUN chmod +x ./entrypoint.sh

COPY ./conf/nginx.conf /etc/nginx/nginx.conf
COPY ./conf/transcendence.conf /etc/nginx/conf.d/transcendence.conf
COPY ./local-game-pong /singlepageapp/local-game-pong/
COPY ./scripts /singlepageapp/scripts/
COPY ./assets /singlepageapp/assets/
COPY ./css /singlepageapp/css/
COPY ./html/* /singlepageapp/
