"""Tests for external booking operations and refresh logic."""

from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

from v1.db.external_bookings import (
    upsert_user_bookings,
    delete_user_bookings,
    add_booking,
    delete_booking,
    get_bookings_by_event_ids,
)
from v1.db.external_token_storage import save_external_token


# ── Basic CRUD ─────────────────────────────────────────────────────────────────

def test_add_and_get_booking():
    add_booking(1, 100)
    result = get_bookings_by_event_ids([100])
    assert 1 in result[100]


def test_add_booking_idempotent():
    add_booking(1, 100)
    add_booking(1, 100)
    result = get_bookings_by_event_ids([100])
    assert len(result[100]) == 1


def test_delete_booking():
    add_booking(1, 100)
    delete_booking(1, 100)
    assert get_bookings_by_event_ids([100]) == {}


def test_delete_user_bookings():
    add_booking(1, 100)
    add_booking(1, 200)
    delete_user_bookings(1)
    assert get_bookings_by_event_ids([100, 200]) == {}


def test_upsert_replaces_bookings():
    add_booking(1, 100)
    add_booking(1, 200)
    upsert_user_bookings(1, [200, 300])
    result = get_bookings_by_event_ids([100, 200, 300])
    assert 1 not in result.get(100, set())
    assert 1 in result.get(200, set())
    assert 1 in result.get(300, set())


def test_upsert_empty_list_deletes_all():
    add_booking(1, 100)
    upsert_user_bookings(1, [])
    assert get_bookings_by_event_ids([100]) == {}


def test_get_bookings_by_event_ids_empty():
    assert get_bookings_by_event_ids([]) == {}


def test_get_bookings_multiple_users():
    add_booking(1, 100)
    add_booking(2, 100)
    add_booking(3, 200)
    result = get_bookings_by_event_ids([100, 200])
    assert result[100] == {1, 2}
    assert result[200] == {3}


# ── refresh_external_bookings exception path (swagapp-ce6tu) ──────────────────

def test_refresh_skips_user_on_api_exception():
    """API exception must not wipe existing bookings for that user."""
    add_booking(1, 100)

    expires = datetime.now() + timedelta(hours=1)
    save_external_token(1, "token", expires)

    from v1.jobs.refresh_events import refresh_external_bookings

    with patch("v1.jobs.refresh_events.get_booked_external_events", side_effect=Exception("API down")):
        refresh_external_bookings()

    # Bookings must still be there
    assert 1 in get_bookings_by_event_ids([100]).get(100, set())


def test_refresh_updates_when_api_succeeds():
    """Successful API call replaces bookings normally."""
    add_booking(1, 100)

    expires = datetime.now() + timedelta(hours=1)
    save_external_token(1, "token", expires)

    mock_event = MagicMock()
    mock_event.eventId = 200

    from v1.jobs.refresh_events import refresh_external_bookings

    with patch("v1.jobs.refresh_events.get_booked_external_events", return_value=[mock_event]):
        refresh_external_bookings()

    result = get_bookings_by_event_ids([100, 200])
    assert 1 not in result.get(100, set())
    assert 1 in result.get(200, set())


# ── Session rollback (swagapp-49zpt) ──────────────────────────────────────────

def test_session_rollback_on_exception():
    """Failed write inside get_session() must not leave partial state."""
    from v1.db.database import get_session
    from v1.db.tables import ExternalEventBookingTable

    try:
        with get_session() as session:
            session.add(ExternalEventBookingTable(userId=99, eventId=999))
            raise RuntimeError("simulated failure")
    except RuntimeError:
        pass

    # Must have been rolled back
    assert get_bookings_by_event_ids([999]) == {}
