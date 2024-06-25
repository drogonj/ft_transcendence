#!/bin/sh

while [ ! -d "/tmp_static/admin" ]
do
  echo waiting for django-statics...
  sleep 1
done

echo 'SecRule ARGS:testparam "@contains test" "id:1234,deny,status:403' >> etc/nginx/modsec/modsecurity.conf
cp -r /tmp_static/* /singlepageapp

nginx -g 'daemon off;'
