FROM python:3.10-slim-bullseye
LABEL maintainer="ngalzand <ngalzand@student.42mulhouse.fr>"
LABEL version="0.2"
LABEL description="User-management microservice"

WORKDIR /user-management
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

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "user-management.asgi:application"]
