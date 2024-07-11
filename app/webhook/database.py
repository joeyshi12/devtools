import os
import re
import uuid
import logging
import json
import datetime
from typing import Optional
from dataclasses import dataclass
import mariadb

logger = logging.getLogger("waitress")
db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "database": os.getenv("DB_NAME")
}


@dataclass
class RequestCapture:
    url: str
    method: str
    body: str
    headers: dict[str, str]
    creation_date: str


def get_connection():
    connection = mariadb.connect(**db_config)
    connection.autocommit = False
    return connection


def webhook_history_exists(webhook_id: str):
    with get_connection() as connection:
        cursor = connection.cursor()
        query = "SELECT EXISTS (SELECT id FROM webhook_history WHERE id = ?)"
        cursor.execute(query, (webhook_id,))
        return bool(cursor.fetchone()[0])

    return False


def create_request_history():
    webhook_id = str(uuid.uuid4())
    creation_date = datetime.datetime.today().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    with get_connection() as connection:
        cursor = connection.cursor()
        query = (
            "INSERT INTO webhook_history "
            "VALUES (?, ?)"
        )
        cursor.execute(query, (webhook_id, creation_date))
        connection.commit()

    return webhook_id


def insert_request_capture(webhook_id: str, capture: RequestCapture):
    with get_connection() as connection:
        if not is_valid_uuid(webhook_id):
            raise Exception(f"Invalid webhook ID {webhook_id}")
        cursor = connection.cursor()
        query = (
            "INSERT INTO request_capture "
            "VALUES (?, ?, ?, ?, ?, ?)"
        )
        headers_str = json.dumps(capture.headers)
        params = (
            webhook_id,
            capture.url,
            capture.method,
            capture.body,
            headers_str,
            capture.creation_date
        )
        cursor.execute(query, params)
        connection.commit()


def get_request_captures(webhook_id: str):
    captures = []
    with get_connection() as connection:
        cursor = connection.cursor()
        query = (
            "SELECT webhook_id, url, method, body, headers, creation_date "
            "FROM request_capture "
            "WHERE webhook_id = ? "
            "ORDER BY creation_date"
        )
        cursor.execute(query, (webhook_id,))
        for row in cursor.fetchall():
            _, url, method, body, headers_str, creation_date = row
            headers = json.loads(headers_str)
            captures.append(RequestCapture(url, method, body, headers, creation_date))
        logger.info("Read %d request captures for webhook session %s", len(captures), webhook_id)

    return captures


def delete_request_captures(webhook_id: str, expire_date: Optional[str] = None):
    with get_connection() as connection:
        cursor = connection.cursor()
        query = (
            "DELETE FROM request_capture "
            "WHERE webhook_id = ?"
        )
        if expire_date is None:
            cursor.execute(query, (webhook_id,))
        else:
            query = query + " AND creation_date = ?"
            cursor.execute(query, (webhook_id, expire_date))

        connection.commit()


def is_valid_uuid(uuid_str: str):
    uuid_pattern = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    match = re.match(uuid_pattern, uuid_str)
    return bool(match)
