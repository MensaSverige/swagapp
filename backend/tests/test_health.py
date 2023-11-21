import pytest
from server import app as flask_app  # Import your Flask app


@pytest.fixture
def app():
    app = flask_app
    app.config.update({
        "TESTING": True,
    })
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


def test_health_endpoint(client):
    response = client.get('/health')
    assert response.status_code == 200
    expected_response = {
        'status': 'healthy',
        'commit_message': 'Unknown',  # Expected value in test environment
        # Expected value in test environment
        'commit_url': 'https://github.com/skaramicke/swagapp/commit/Unknown'
    }
    assert response.json == expected_response
