import os
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase

logger = logging.getLogger(__name__)
DB_PATH = os.getenv("DB_PATH", "db.sqlite3")

engine = create_engine(f"sqlite:///{DB_PATH}")


class Base(DeclarativeBase):
    pass


@event.listens_for(engine, "connect")
def _enable_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.close()


def init_db():
    """Create all tables registered on Base's metadata, if they don't already exist."""
    Base.metadata.create_all(engine)
    logger.info("Initialized SQLite database at %s", DB_PATH)
