import re
import uuid
import logging
import json
import datetime
from typing import Optional
from sqlalchemy import Text, ForeignKey, select, delete, exists
from sqlalchemy.orm import Mapped, mapped_column, Session
from ..database import engine, Base

logger = logging.getLogger(__name__)


class WebhookHistory(Base):
    __tablename__ = "webhook_history"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    creation_date: Mapped[str] = mapped_column(Text)


class RequestCapture(Base):
    __tablename__ = "request_capture"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    webhook_id: Mapped[str] = mapped_column(
        Text, ForeignKey("webhook_history.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(Text)
    method: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text)
    headers_json: Mapped[str] = mapped_column("headers", Text)
    creation_date: Mapped[str] = mapped_column(Text)

    def __init__(self, url: str, method: str, body: str, headers: dict[str, str], creation_date: str, **kwargs):
        super().__init__(
            url=url,
            method=method,
            body=body,
            headers_json=json.dumps(headers),
            creation_date=creation_date,
            **kwargs
        )

    @property
    def headers(self) -> dict[str, str]:
        return json.loads(self.headers_json)

    def to_dict(self) -> dict:
        return {
            "url": self.url,
            "method": self.method,
            "body": self.body,
            "headers": self.headers,
            "creation_date": self.creation_date
        }


def webhook_history_exists(webhook_id: str) -> bool:
    with Session(engine) as session:
        query = select(exists().where(WebhookHistory.id == webhook_id))
        return bool(session.execute(query).scalar())


def create_request_history():
    webhook_id = str(uuid.uuid4())
    creation_date = datetime.datetime.today().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    with Session(engine) as session:
        session.add(WebhookHistory(id=webhook_id, creation_date=creation_date))
        session.commit()

    return webhook_id


def insert_request_capture(webhook_id: str, capture: RequestCapture):
    if not is_valid_uuid(webhook_id):
        raise Exception(f"Invalid webhook ID {webhook_id}")
    with Session(engine, expire_on_commit=False) as session:
        capture.webhook_id = webhook_id
        session.add(capture)
        session.commit()


def get_request_captures(webhook_id: str) -> list[RequestCapture]:
    with Session(engine) as session:
        query = (
            select(RequestCapture)
            .where(RequestCapture.webhook_id == webhook_id)
            .order_by(RequestCapture.creation_date)
        )
        captures = list(session.scalars(query))
        session.expunge_all()
        logger.info("Read %d request captures for webhook session %s", len(captures), webhook_id)

    return captures


def delete_request_captures(webhook_id: str, expire_date: Optional[str] = None):
    with Session(engine) as session:
        query = delete(RequestCapture).where(
            RequestCapture.webhook_id == webhook_id
        )
        if expire_date is not None:
            query = query.where(RequestCapture.creation_date == expire_date)
        session.execute(query)
        session.commit()


def is_valid_uuid(uuid_str: str):
    uuid_pattern = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    match = re.match(uuid_pattern, uuid_str)
    return bool(match)
