FROM python:3.10-slim-bullseye
LABEL maintainer="ayagmur <ayagmur@student.42mulhouse.fr>"
LABEL version="0.1"
LABEL description="Back game pong microservice"

COPY requirements.txt .

RUN apt-get update && apt-get upgrade -y && \
apt-get install -y --no-install-recommends \
build-essential \
		libpq-dev  && \
		apt-get clean && \
		rm -rf /var/lib/apt/lists/* && \
		pip install --upgrade pip && \
		pip install -r requirements.txt

COPY . .

RUN chmod +x server.py
ENTRYPOINT ["python", "-u","server.py"]