import pytest
import json
from server import app as flask_app
import requests_mock
from unittest import mock
from unittest.mock import MagicMock
from pymongo import MongoClient

mock_client = MagicMock(spec=MongoClient)


@pytest.fixture(autouse=True)
def mock_db(monkeypatch):
    monkeypatch.setattr("server.MongoClient", lambda *args,
                        **kwargs: mock_client)


@pytest.fixture
def app():
    app = flask_app
    app.config.update({
        "TESTING": True,
        "SECRET_KEY": "your_secret_key_for_testing"
    })
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


def test_auth_endpoint_success(client):
    dummy_user = {
        "_id": "dummy_id",  # Add more fields as needed
        "username": "testuser",
        "name": "Test User",
        # Add other fields that your user document would normally have
    }

    with requests_mock.Mocker() as m, \
            mock.patch('auth.users_collection.find_one', return_value=dummy_user), \
            mock.patch('auth.users_collection.update_one'), \
            mock.patch('auth.users_collection.insert_one'):

        m.post('https://medlem.mensa.se/login/',
               text='<input type="hidden" name="csrfKey" value="test_csrf_token" />')
        m.get('https://medlem.mensa.se/login/',
              text='User Logged In Successfully')

        response = client.post('/auth', json={
            "username": "testuser",
            "password": "testpassword"
        })

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "refresh_token" in data
        assert "access_token" in data


def test_auth_endpoint_failure(client):
    with requests_mock.Mocker() as m:
        m.get('https://medlem.mensa.se/login/',
              text='<input type="hidden" name="csrfKey" value="test_csrf_token" />')
        m.post('https://medlem.mensa.se/login/',
               text='Login page content here',
               status_code=401)

        response = client.post('/auth', json={
            "username": "wronguser",
            "password": "wrongpassword"
        })

        assert response.status_code == 401

        assert "refresh_token" not in json.loads(response.data)
        assert "access_token" not in json.loads(response.data)
