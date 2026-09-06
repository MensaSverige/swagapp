"""Regression tests for the legacy /v1/user_events update notice.

The real endpoints behind this route were removed; app versions predating the
unified /v1/events still poll it, and this notice is the only channel left to
tell those users to upgrade.

It was previously built as an ExtendedUserEvent while passing `title` and
`date` — fields that model does not have — so it raised a validation error and
returned 500 from the commit that introduced it. Nobody noticed, because the
only clients that call it are old builds nobody runs in development.

These tests pin the two properties that matter: it responds at all, and it
carries a working way to update.
"""

import asyncio

from v1.legacy import outdated_app_notice as legacy
from v1.legacy.outdated_app_notice import outdated_app_notice as notice_route


def _notice():
    """Invoke the route directly.

    No TestClient: starlette's needs httpx, which is not a dependency. Calling
    the handler is faithful to the original failure anyway — the 500 came from
    building the model inside this function, not from the HTTP layer.
    """
    return asyncio.run(notice_route(current_user={"userId": 1, "isMember": True}))


def test_notice_endpoint_returns_200():
    """The whole point: it must not raise. It used to 500."""
    assert _notice() is not None  # raised ValidationError before


def test_notice_is_a_single_event_shaped_item():
    body = _notice()

    assert isinstance(body, list)
    assert len(body) == 1
    # Old clients render these keys; renaming any of them silently blanks the
    # notice on exactly the builds that cannot be fixed.
    for key in ("id", "name", "description", "start", "userId", "ownerName"):
        assert key in body[0], f"legacy clients read '{key}'"


def test_notice_links_to_both_stores():
    """A notice telling users to update is useless without the links."""
    description = _notice()[0]["description"]

    assert "play.google.com" in description
    assert "apps.apple.com" in description


def test_notice_start_is_far_future():
    """Old clients filter to upcoming events.

    The previous payload was dated 2025-11-23, so even had it not 500'd it
    would have been filtered out of the list before anyone saw it.
    """
    start = _notice()[0]["start"]

    assert start.startswith("2099"), f"notice would be filtered out as past: {start}"


def test_notice_does_not_depend_on_the_user_event_model():
    """The payload must not be rebuilt from a model that is still evolving.

    That coupling is what broke it: UserEvent gained required fields and took
    the notice down with it. A literal cannot regress that way.
    """
    assert isinstance(legacy._OUTDATED_APP_NOTICE, list)
    assert isinstance(legacy._OUTDATED_APP_NOTICE[0], dict)
