#!/bin/sh

while [ ! -d "/tmp_static/admin" ]
do
  echo waiting for django-statics...
  sleep 1
done

cp -r /tmp_static/* /singlepageapp

nginx -g 'daemon off;'
