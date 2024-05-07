FROM python:3.12.1-slim-bullseye
ENV PYTHONUNBUFFERED 1
RUN mkdir /code
ADD ./project /code
WORKDIR /code
COPY project/requirements.txt /code/
RUN pip install -r requirements.txt
COPY . /code/
CMD ["gunicorn", "project.wsgi:application", "--bind", "0.0.0.0:8000"]
