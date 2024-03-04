import os
import logging
import json
from typing import Optional
from dataclasses import dataclass
import mariadb

logger = logging.getLogger("waitress")
db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME")
}


@dataclass
class RequestCapture:
    url: str
    method: str
    cookies: dict[str, str]
    body: str
    headers: dict[str, str]
    creation_date: str


def get_connection():
    connection = mariadb.connect(**db_config)
    connection.autocommit = False
    return connection


def insert_request_capture(webhook_session_id: str, capture: RequestCapture):
    with get_connection() as connection:
        try:
            cursor = connection.cursor()
            query = (
                "INSERT INTO request_capture "
                "VALUES (?, ?, ?, ?, ?, ?, ?)"
            )
            cookies_str = json.dumps(capture.cookies)
            headers_str = json.dumps(capture.headers)
            params = (
                webhook_session_id,
                capture.url,
                capture.method,
                capture.body,
                cookies_str,
                headers_str,
                capture.creation_date
            )
            cursor.execute(query, params)
            connection.commit()
        except Exception as e:
            logger.error("Failed to insert request capture for session %s", webhook_session_id, e)
            raise e


def get_request_captures(webhook_session_id: str):
    captures = []
    with get_connection() as connection:
        try:
            cursor = connection.cursor()
            query = (
                "SELECT webhook_session_id, url, method, body, cookies, headers, creation_date "
                "FROM request_capture "
                "WHERE webhook_session_id = ? "
                "ORDER BY creation_date"
            )
            cursor.execute(query, (webhook_session_id,))
            for row in cursor.fetchall():
                _, url, method, body, cookies_str, headers_str, creation_date = row
                cookies = json.loads(cookies_str)
                headers = json.loads(headers_str)
                captures.append(RequestCapture(url, method, cookies, body, headers, creation_date))
            logger.info("Read %d request captures for webhook session %s", len(captures), webhook_session_id)
        except Exception as e:
            logger.error("Failed to fetch request captures", e)

    return captures


def delete_request_captures(webhook_session_id: str, expire_date: Optional[str] = None):
    with get_connection() as connection:
        cursor = connection.cursor()
        try:
            query = (
                "DELETE FROM request_capture "
                "WHERE webhook_session_id = ?"
            )

            if expire_date is None:
                cursor.execute(query, (webhook_session_id,))
            else:
                query = query + " AND creation_date = ?"
                cursor.execute(query, (webhook_session_id, expire_date))

            connection.commit()
        except Exception as e:
            logger.error("Failed to delete request capture for session %s", webhook_session_id, e)
            raise e
