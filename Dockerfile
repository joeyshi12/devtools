FROM python:3.10

WORKDIR /dist
COPY . .
RUN pip3 install -r requirements.txt

EXPOSE 8080
CMD ["waitress-serve", "--port=8080", "--call", "app:create_app"]
