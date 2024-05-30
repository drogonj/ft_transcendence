FROM postgres:16-alpine3.20
LABEL maintainer="jmathieu <jmathieu@student.42mulhouse.fr>"
LABEL version="0.1"
LABEL description="This is the base image for our DB"
RUN apk update && apk upgrade
COPY ./script/init.sh ./var/lib/postgresql/init.sh
CMD ["/bin/sh", "./var/lib/postgresql/init.sh"]