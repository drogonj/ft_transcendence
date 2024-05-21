FROM python:3.11.4-slim-buster

RUN pip install --upgrade pip
COPY ./requirements.txt .
COPY ./app ./app
RUN pip install -r requirements.txt
EXPOSE 8000

WORKDIR /app

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]