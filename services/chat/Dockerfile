FROM python:3.10-slim-bullseye
LABEL maintainer="jmathieu <jmathieu@student.42mulhouse.fr>"
LABEL version="0.1"
LABEL description="Chat microservice"

WORKDIR /chat
COPY requirements.txt .

RUN apt-get update && apt-get upgrade -y && \
apt-get install -y --no-install-recommends build-essential \
libpq-dev redis-server netcat jq curl && \
apt-get clean && \
rm -rf /var/lib/apt/lists/* && \
pip install --upgrade pip && \
pip install -r requirements.txt

COPY . .
		
RUN chmod +x start.sh

ENTRYPOINT ["./start.sh"]