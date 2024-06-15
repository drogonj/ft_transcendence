FROM python:3.10-slim-bullseye
LABEL maintainer="jmathieu <jmathieu@student.42mulhouse.fr>"
LABEL version="0.1"
LABEL description="AI microservice"

WORKDIR /ai
EXPOSE 8042
COPY . .

RUN apt-get update && apt-get upgrade -y \
	&& apt-get install -y --no-install-recommends \
		build-essential \
		libpq-dev \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip
RUN pip install -r requirements.txt && \
    python manage.py migrate

CMD ["daphne", "-b", "0.0.0.0", "-p", "8042", "ai.asgi:application"]