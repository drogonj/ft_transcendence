FROM python:3.10-slim-bullseye
LABEL maintainer="jmathieu <jmathieu@student.42mulhouse.fr>"
LABEL version="0.1"
LABEL description="This is the base image for our ASGI"
RUN apt-get update && apt-get upgrade -y \
	&& apt-get install -y --no-install-recommends \
		build-essential \
		libpq-dev \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8081
CMD ["daphne", "-b", "0.0.0.0", "-p", "8081", "asgi.asgi:application"]