FROM python:3.14.0b1

WORKDIR /dist

COPY . /dist

RUN pip install --no-cache-dir -r requirements.txt

CMD ["waitress-serve", "--port=2718", "--call", "app:create_app"]
