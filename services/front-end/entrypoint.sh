#!/bin/sh

while [ ! -d "/tmp_static/admin" ]
do
  echo waiting for django-statics...
  sleep 1
done

sleep 5

NGINX_CONF="/etc/nginx/conf.d/transcendence.conf"

if [ -z "$WEBSITE_HOSTNAME" -o -z "$WEBSITE_URL" ]; then
  echo "Error: WEBSITE_URL or WEBSITE_HOSTNAME not set."
  exit 1
fi

sed -i "s/website-hostname-template/$WEBSITE_HOSTNAME/g" "$NGINX_CONF"
sed -i "s/website-url-template/$WEBSITE_URL/g" "$NGINX_CONF"

cp -r /tmp_static/* /singlepageapp

nginx -g 'daemon off;'
