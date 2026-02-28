"""Test configuration — swap PostgreSQL for in-memory SQLite."""

import os

# Set required env vars before any app code is imported
os.environ["LOGINM_SEED"] = "test"
os.environ["LOGINB_SEED"] = "test"
os.environ["EVENT_API_TOKEN"] = "test"
os.environ["URL_MEMBER_API"] = "http://test"
os.environ["URL_EXTERNAL_ROOT"] = "http://test"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["TEST_MODE"] = "true"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from v1.db import database
from v1.db.database import Base

# Import all table models so metadata knows about them
import v1.db.tables  # noqa: F401


@pytest.fixture(autouse=True)
def fresh_db():
    """Create a fresh in-memory SQLite database for every test."""
    test_engine = create_engine("sqlite:///:memory:", echo=False)

    # Enable foreign key support in SQLite
    @event.listens_for(test_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    # Patch the module-level globals so get_session() uses the test engine
    database.engine = test_engine
    database.SessionLocal = sessionmaker(bind=test_engine)

    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
