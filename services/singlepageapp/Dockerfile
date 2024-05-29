FROM python:3.10-slim-bullseye
LABEL maintainer="ngalzand <ngalzand@student.42mulhouse.fr>"
LABEL version="0.1"
LABEL description="Testing Django SPA deployment"
WORKDIR /singlepageapp
RUN apt-get update && apt-get upgrade -y \
	&& apt-get install -y --no-install-recommends \
		build-essential \
		libpq-dev \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip
COPY . .
RUN pip install -r requirements.txt && \
    python manage.py collectstatic --noinput && \
    python manage.py migrate

# -b 0.0.0.0 = --bind sur toutes les IPs
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "singlepageapp.asgi:application"]
