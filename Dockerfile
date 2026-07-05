FROM python:3.14.0b1

WORKDIR /dist
COPY ./app app
COPY ./requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

ENV DB_PATH=/data/db.sqlite3
VOLUME ["/data"]

# Set owner of app files to non-root user
RUN groupadd --gid 1000 appuser \
    && useradd --uid 1000 --gid appuser --shell /usr/sbin/nologin --create-home appuser \
    && mkdir -p /data \
    && chown -R appuser:appuser /dist /data

USER appuser

CMD ["waitress-serve", "--port=8080", "--call", "app:create_app"]
