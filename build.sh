#!/bin/bash

if [ -z $1 ]
then
  echo Please, enter a build value such as: up, down, clear
else
  txt=$(cat docker-compose.yml)
  while IFS= read -r line; do
    length=${#line}
    for ((i = 0; i < length; i++)); do
      char="${line:i:1}"
      if [ $char == '=' ]
      then
        key=${line:0:i}
        line=${line:i+1}
        txt=$(printf "$txt" | sed "s~{$key}~$line~g")
        break
      fi
    done
  done < .env
  echo "$txt" > "docker-compose_tmp.yml"
  if [ $1 == "up" ]
  then
    docker compose -f ./docker-compose_tmp.yml up -d --build
  elif [ $1 == "clear" ]
  then
    docker compose -f ./docker-compose_tmp.yml rm -f -s
  elif [ $1 == "down" ]
  then
    docker compose -f ./docker-compose.yml down
  elif [ $1 == "re" ]
  then
    docker compose -f ./docker-compose_tmp.yml rm -f -s
    docker compose -f ./docker-compose_tmp.yml up -d --build
  else
    echo Error: Unknow action
  fi
  rm docker-compose_tmp.yml
fi
