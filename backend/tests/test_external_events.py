"""Tests for external event and token storage DB operations."""

from datetime import datetime, timedelta
from v1.db.external_events import (
    store_external_root,
    get_stored_external_root,
    store_external_event_details,
    get_stored_external_event_details,
    get_all_stored_external_event_details,
    clean_external_events,
)
from v1.db.external_token_storage import save_external_token, get_external_token
from v1.db.models.external_events import ExternalEventDetails, ExternalRoot


# ── External Root ─────────────────────────────────────────────────────────────

def _make_root(**overrides):
    base = dict(
        version=1,
        loginUrl="https://example.com/login",
        restUrl="https://example.com/api",
        siteUrl="https://example.com",
        dates=["2025-06-01", "2025-06-02"],
        header1="SWAG 2025",
        header2="Mensa Sverige",
        city="Örebro",
        streetAddress="Storgatan 1",
        mapUrl="https://maps.example.com",
    )
    base.update(overrides)
    return ExternalRoot(**base)


def test_store_and_get_root():
    root = _make_root()
    store_external_root(root)

    fetched = get_stored_external_root()
    assert fetched is not None
    assert fetched.version == 1
    assert fetched.city == "Örebro"
    assert fetched.dates == ["2025-06-01", "2025-06-02"]


def test_get_root_when_empty():
    assert get_stored_external_root() is None


def test_store_root_upsert():
    store_external_root(_make_root(city="Örebro"))
    store_external_root(_make_root(city="Stockholm"))

    fetched = get_stored_external_root()
    assert fetched.city == "Stockholm"


def test_store_root_updates_dates():
    store_external_root(_make_root(dates=["2025-06-01"]))
    store_external_root(_make_root(dates=["2025-06-01", "2025-06-02", "2025-06-03"]))

    fetched = get_stored_external_root()
    assert len(fetched.dates) == 3


# ── External Event Details ────────────────────────────────────────────────────

def _make_event(event_id=1, **overrides):
    base = dict(
        eventId=event_id,
        eventDate=datetime(2025, 6, 1, 10, 0),
        startTime="10:00",
        endTime="12:00",
        titel=f"Event {event_id}",
        description="A test event",
        speaker="Speaker",
        location="Room 1",
        isFree=True,
        price=0,
        isLimited=False,
        stock=100,
        showBooked=True,
        booked=0,
        eventUrl=f"https://example.com/event/{event_id}",
    )
    base.update(overrides)
    return ExternalEventDetails(**base)


def test_store_and_get_event_details():
    events = [_make_event(1), _make_event(2)]
    store_external_event_details(events)

    fetched = get_stored_external_event_details([1, 2])
    assert len(fetched) == 2
    titles = {e.titel for e in fetched}
    assert "Event 1" in titles
    assert "Event 2" in titles


def test_get_event_details_partial():
    store_external_event_details([_make_event(1), _make_event(2), _make_event(3)])
    fetched = get_stored_external_event_details([1, 3])
    assert len(fetched) == 2


def test_store_event_upsert():
    store_external_event_details([_make_event(1, titel="Original")])
    store_external_event_details([_make_event(1, titel="Updated")])

    fetched = get_stored_external_event_details([1])
    assert len(fetched) == 1
    assert fetched[0].titel == "Updated"


def test_get_all_event_details():
    store_external_event_details([_make_event(1), _make_event(2)])
    all_events = get_all_stored_external_event_details()
    assert len(all_events) == 2


def test_clean_external_events():
    store_external_event_details([_make_event(1), _make_event(2), _make_event(3)])

    # Keep only event 2
    clean_external_events([_make_event(2)])

    remaining = get_all_stored_external_event_details()
    assert len(remaining) == 1
    assert remaining[0].eventId == 2


def test_event_with_categories():
    event = _make_event(1, categories=[
        {"code": "WS", "text": "Workshop", "colorText": "#000", "colorBackground": "#fff"},
        {"code": "TK", "text": "Talk", "colorText": "#111", "colorBackground": "#eee"},
    ])
    store_external_event_details([event])

    fetched = get_stored_external_event_details([1])
    assert len(fetched) == 1
    assert len(fetched[0].categories) == 2
    assert fetched[0].categories[0].code == "WS"


def test_event_with_admins():
    event = _make_event(1, admins=["42", "99"])
    store_external_event_details([event])

    fetched = get_stored_external_event_details([1])
    assert len(fetched) == 1
    assert "42" in fetched[0].admins
    assert "99" in fetched[0].admins


def test_get_events_by_host_id():
    store_external_event_details([
        _make_event(1, admins=["42"]),
        _make_event(2, admins=["99"]),
        _make_event(3),
    ])

    # Should find event 1 by admin match, plus any in the ID list
    fetched = get_stored_external_event_details([3], host_id=42)
    event_ids = {e.eventId for e in fetched}
    assert 1 in event_ids  # matched by admin
    assert 3 in event_ids  # matched by ID


# ── Token Storage ─────────────────────────────────────────────────────────────

def test_save_and_get_token():
    expires = datetime.now() + timedelta(hours=1)
    save_external_token(100, "token-abc", expires)

    token = get_external_token(100)
    assert token == "token-abc"


def test_get_nonexistent_token():
    assert get_external_token(999) is None


def test_token_upsert():
    expires = datetime.now() + timedelta(hours=1)
    save_external_token(100, "token-1", expires)
    save_external_token(100, "token-2", expires)

    token = get_external_token(100)
    assert token == "token-2"


def test_expired_token_returns_none():
    expires = datetime.now() - timedelta(hours=1)
    save_external_token(100, "expired-token", expires)

    assert get_external_token(100) is None
