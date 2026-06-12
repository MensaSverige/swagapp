"""
Integration tests for auth endpoints and the /v1/tags catalog.
Uses the mongomock-backed TestClient from conftest.py.
"""
import os


def test_authm_review_user_success(client):
    resp = client.post("/v1/authm", json={
        "username": os.environ["APPLE_REVIEW_USER"],
        "password": os.environ["REVIEW_PASSWORD"],
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "accessToken" in body
    assert "refreshToken" in body
    assert "user" in body
    assert body["user"]["userId"] == 1  # apple review user id


def test_authm_wrong_password_returns_4xx(client):
    # review_user check returns None → loginm is called.
    # Patch loginm to simulate the Mensa API rejecting the credentials.
    from unittest.mock import patch
    from fastapi import HTTPException as FastAPIHTTPException
    with patch("v1.api.auth.loginm", side_effect=FastAPIHTTPException(status_code=401, detail="Unauthorized")):
        resp = client.post("/v1/authm", json={
            "username": os.environ["APPLE_REVIEW_USER"],
            "password": "definitely_wrong",
        })
    assert resp.status_code == 401


def test_tags_endpoint_returns_all_interest_tags(client):
    resp = client.get("/v1/tags")
    assert resp.status_code == 200
    tags = resp.json()
    assert isinstance(tags, list)
    assert len(tags) > 0
    first = tags[0]
    assert "code" in first
    assert "text" in first
    assert "colorBackground" in first
    assert "colorText" in first


def test_tags_codes_are_lowercase_ascii(client):
    resp = client.get("/v1/tags")
    assert resp.status_code == 200
    for tag in resp.json():
        code = tag["code"]
        assert code == code.lower(), f"tag code not lowercase: {code}"
        assert code.replace("_", "").isalpha(), f"unexpected chars in code: {code}"


def test_protected_endpoint_requires_auth(client):
    resp = client.get("/v1/interests")
    assert resp.status_code in (401, 403)


def test_protected_endpoint_accessible_with_valid_token(client, apple_auth):
    resp = client.get("/v1/interests", headers={"Authorization": f"Bearer {apple_auth}"})
    assert resp.status_code == 200
