"""
Test fixtures for the SWAG backend.

Patches pymongo.MongoClient with mongomock before any module that touches
v1.db.mongo is imported, so tests run without a real MongoDB instance.
"""
import os
import sys

# --- env vars required by v1.env_constants before anything imports it ---
os.environ.setdefault("LOGINM_SEED", "test_seed")
os.environ.setdefault("LOGINB_SEED", "test_seed")
os.environ.setdefault("EVENT_API_TOKEN", "test_token")
os.environ.setdefault("URL_MEMBER_API", "http://test-member-api")
os.environ.setdefault("URL_EXTERNAL_ROOT", "http://test-external-root")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only")
os.environ.setdefault("TEST_MODE", "true")
os.environ.setdefault("APPLE_REVIEW_USER", "apple@apple.com")
os.environ.setdefault("GOOGLE_REVIEW_USER", "google@google.com")
os.environ.setdefault("REVIEW_PASSWORD", "test-review-password")
os.environ.setdefault("COOKIE_SECURE", "false")

# --- patch pymongo BEFORE any import that reaches v1.db.mongo ---
import mongomock
import pymongo

pymongo.MongoClient = mongomock.MongoClient

import pytest
from starlette.testclient import TestClient
from unittest.mock import MagicMock

# server.py mounts /static/img; stub StaticFiles so it doesn't require the dir
import starlette.staticfiles
starlette.staticfiles.StaticFiles = MagicMock(return_value=MagicMock())

from v1.server import app
from v1.db.mongo import initialize_db


@pytest.fixture(scope="session", autouse=True)
def _init_db():
    """Seed the mongomock DB with review users once per session."""
    initialize_db()


@pytest.fixture(scope="session")
def client():
    """Synchronous TestClient wrapping the FastAPI app."""
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


@pytest.fixture()
def apple_auth(client):
    """Returns a valid Bearer token for the Apple review user."""
    resp = client.post("/v1/authm", json={
        "username": os.environ["APPLE_REVIEW_USER"],
        "password": os.environ["REVIEW_PASSWORD"],
    })
    assert resp.status_code == 200, resp.text
    return resp.json()["accessToken"]
