"""Route-level tests for /v1/users — what the router resolves, not what the
handlers compute.

GET /v1/users/me returned 400 "unable to parse string as an integer:
`path.user_id`" on live prod and on the Postgres build: `/users/{user_id}` was
declared above `/users/me`, so the first matching route won and "me" was handed
to an `int` path parameter (SWAGAPP-490). The app's tryGetCurrentUser never saw
a 200, so every app start fell through to re-authenticating against Mensa's
member API.

Requests go through the ASGI app with a real access token. No TestClient:
starlette's needs httpx, which is not a dependency — and the bug lives in route
matching, which calling a handler directly skips entirely.
"""

import asyncio
import json

import pytest
from fastapi import FastAPI

from v1.api.users import users_v1
from v1.db.users import create_user, update_user
from v1.dev.exception_handlers import register_exception_handlers
from v1.token_handler import create_access_token


def _app():
    """The routes under test, mounted as server.py mounts them.

    The validation-error handler comes along because it is what turns FastAPI's
    422 into the 400 production reported.
    """
    app = FastAPI()
    register_exception_handlers(app)
    app.include_router(users_v1)
    return app


def _get(path, token):
    """One GET through the whole stack: router, dependencies, response model."""
    scope = {
        "type": "http",
        "asgi": {"version": "3.0", "spec_version": "2.1"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "root_path": "",
        "headers": [(b"host", b"test"),
                    (b"authorization", f"Bearer {token}".encode())],
        "client": ("test", 1),
        "server": ("test", 80),
    }
    messages = []

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message):
        messages.append(message)

    asyncio.run(_app()(scope, receive, send))

    status = next(m["status"] for m in messages
                  if m["type"] == "http.response.start")
    body = b"".join(m.get("body", b"") for m in messages
                    if m["type"] == "http.response.body")
    return status, (json.loads(body) if body else None)


@pytest.fixture
def member():
    """A logged-in member, as /auth leaves one: a row plus a valid token."""
    user = create_user({
        "memberId": 1001,
        "type": "M",
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
    })
    return user, create_access_token(user["userId"])


def test_get_users_me_returns_the_caller(member):
    """The regression: "me" must not be parsed as a user id."""
    user, token = member

    status, body = _get("/v1/users/me", token)

    assert status == 200, body  # was 400 "unable to parse string as an integer"
    assert body["userId"] == user["userId"]
    assert body["firstName"] == "Test"


def test_get_users_me_is_not_matched_by_the_user_id_route(member):
    """Pin the cause, not only the symptom.

    Both routes return 200 for the caller's own row, so a status assertion
    alone would pass again the moment someone reorders the decorators back.
    """
    _, token = member

    route = next(r for r in users_v1.routes
                 if getattr(r, "path", None) in ("/v1/users/me",
                                                 "/v1/users/{user_id}"))

    assert route.path == "/v1/users/me", (
        "/users/{user_id} is declared first, so it shadows /users/me")


def test_get_users_by_id_still_resolves(member):
    """Reordering must not cost the numeric route."""
    user, token = member

    status, body = _get(f"/v1/users/{user['userId']}", token)

    assert status == 200, body
    assert body["userId"] == user["userId"]


def test_get_users_me_does_not_404_for_a_user_without_a_numeric_match(member):
    """/users/me reads the token, so it works even where no id route would.

    A member whose row exists only under the token's subject is the normal
    case on app start; this is the call the app makes first.
    """
    user, token = member
    update_user(user["userId"], {"slogan": "Hello world"})

    status, body = _get("/v1/users/me", token)

    assert status == 200, body
    assert body["slogan"] == "Hello world"
