#!/bin/bash

while [ ! -d "/tmp_static" ]
do
  sleep 1
done

cp -r /tmp_static/* /singlepageapp
rm -rf /tmp_static

nginx -g 'daemon off;'
