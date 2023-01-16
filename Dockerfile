FROM python:3.10

WORKDIR /dist
COPY . .
RUN pip3 install -r requirements.txt

EXPOSE 8080
CMD ["python3", "./app.py"]
