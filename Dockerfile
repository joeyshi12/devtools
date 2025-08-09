FROM python:3.14.0b1

WORKDIR /dist

COPY app ./app

RUN pip install --no-cache-dir -r requirements.txt

CMD ["waitress-serve", "--port=8080", "--call", "app:create_app"]
