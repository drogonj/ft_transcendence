FROM python:3.12.3-slim-bullseye
RUN apt-get update && apt-get upgrade -y
RUN pip install --upgrade pip
COPY ./requirements.txt . \
	./app ./app/
RUN pip install -r requirements.txt
RUN rm -rf /var/cache/apk/*
EXPOSE 8000
WORKDIR /app
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]