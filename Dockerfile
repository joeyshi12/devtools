FROM python:3.14-alpine

WORKDIR /dist
COPY ./app app
COPY ./requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

ENV DB_PATH=/data/db.sqlite3
VOLUME ["/data"]

# Set owner of app files to non-root user
RUN addgroup -g 1000 appuser \
    && adduser -D -u 1000 -G appuser -h /home/appuser appuser \
    && mkdir -p /data \
    && chown -R appuser:appuser /dist /data

USER appuser

CMD ["waitress-serve", "--port=8080", "--call", "app:create_app"]
