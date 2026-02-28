"""Tests for user event DB operations."""

from datetime import datetime, timedelta
from v1.db.users import create_user
from v1.user_events.user_events_model import UserEvent
from v1.user_events.user_events_db import (
    create_user_event,
    get_unsafe_user_event,
    get_safe_user_event,
    update_user_event,
    delete_user_event,
    get_unsafe_future_user_events,
    get_safe_future_user_events,
    get_unsafe_user_events_user_owns,
    get_unsafe_user_events_user_is_hosting,
    get_unsafe_user_events_user_is_attending,
    add_attendee_to_user_event,
    remove_attendee_from_user_event,
    add_user_as_host_to_user_event,
    remove_user_from_hosts_of_user_event,
    get_unsafe_user_events_user_is_invited_to_host,
    remove_user_host_invitation_from_user_event,
    add_or_update_report_on_user_event,
    remove_report_from_user_event,
)


def _seed_users():
    """Create test users needed for extend_user_events lookups."""
    create_user({"memberId": 100, "type": "M", "firstName": "Alice", "lastName": "A", "email": "a@test.com"})
    create_user({"memberId": 200, "type": "M", "firstName": "Bob", "lastName": "B", "email": "b@test.com"})
    create_user({"memberId": 300, "type": "M", "firstName": "Charlie", "lastName": "C", "email": "c@test.com"})


def _make_event(**overrides) -> UserEvent:
    now = datetime.now()
    base = dict(
        userId=100,
        name="Test Event",
        start=now + timedelta(hours=1),
        end=now + timedelta(hours=3),
        description="A test event",
        hosts=[],
        suggested_hosts=[],
        attendees=[],
        reports=[],
    )
    base.update(overrides)
    return UserEvent(**base)


# ── CRUD ──────────────────────────────────────────────────────────────────────

def test_create_and_get_event():
    _seed_users()
    event = _make_event()
    event_id = create_user_event(event)
    assert event_id is not None

    fetched = get_unsafe_user_event(str(event_id))
    assert fetched is not None
    assert fetched.name == "Test Event"
    assert fetched.userId == 100


def test_get_nonexistent_event():
    assert get_unsafe_user_event("99999") is None


def test_get_safe_event_hides_reports():
    _seed_users()
    event = _make_event(reports=[{"userId": 200, "text": "Bad event"}])
    event_id = create_user_event(event)

    unsafe = get_unsafe_user_event(str(event_id))
    assert len(unsafe.reports) == 1

    safe = get_safe_user_event(str(event_id))
    assert safe is not None
    assert len(safe.reports) == 0
    assert safe.ownerName == "Alice A"


def test_update_event():
    _seed_users()
    event_id = create_user_event(_make_event())
    event = get_unsafe_user_event(str(event_id))
    event.name = "Updated Event"
    assert update_user_event(str(event_id), event) is True

    fetched = get_unsafe_user_event(str(event_id))
    assert fetched.name == "Updated Event"


def test_delete_event():
    _seed_users()
    event_id = create_user_event(_make_event())
    assert delete_user_event(str(event_id)) is True
    assert get_unsafe_user_event(str(event_id)) is None


def test_delete_nonexistent_event():
    assert delete_user_event("99999") is False


# ── Future events ─────────────────────────────────────────────────────────────

def test_get_future_events():
    _seed_users()
    now = datetime.now()

    # Future event (should appear)
    create_user_event(_make_event(
        name="Future",
        start=now + timedelta(hours=2),
        end=now + timedelta(hours=4),
    ))
    # Past event (should not appear)
    create_user_event(_make_event(
        name="Past",
        start=now - timedelta(hours=10),
        end=now - timedelta(hours=8),
    ))

    events = get_unsafe_future_user_events()
    assert len(events) == 1
    assert events[0].name == "Future"


def test_get_future_events_no_end():
    """Events with no end time should appear if start is recent."""
    _seed_users()
    now = datetime.now()
    create_user_event(_make_event(
        name="No End",
        start=now - timedelta(minutes=30),
        end=None,
    ))
    events = get_unsafe_future_user_events()
    assert len(events) == 1
    assert events[0].name == "No End"


def test_safe_future_events_include_names():
    _seed_users()
    create_user_event(_make_event())
    events = get_safe_future_user_events()
    assert len(events) == 1
    assert events[0].ownerName == "Alice A"


# ── Ownership / hosting / attending queries ───────────────────────────────────

def test_events_user_owns():
    _seed_users()
    create_user_event(_make_event(userId=100, name="Owned"))
    create_user_event(_make_event(userId=200, name="Other"))

    owned = get_unsafe_user_events_user_owns(100)
    assert len(owned) == 1
    assert owned[0].name == "Owned"


def test_events_user_is_hosting():
    _seed_users()
    event_id = create_user_event(_make_event(hosts=[{"userId": 200}]))

    hosting = get_unsafe_user_events_user_is_hosting(200)
    assert len(hosting) == 1

    not_hosting = get_unsafe_user_events_user_is_hosting(300)
    assert len(not_hosting) == 0


def test_events_user_is_attending():
    _seed_users()
    create_user_event(_make_event(attendees=[{"userId": 200}]))

    attending = get_unsafe_user_events_user_is_attending(200)
    assert len(attending) == 1

    not_attending = get_unsafe_user_events_user_is_attending(300)
    assert len(not_attending) == 0


# ── Attendee management ──────────────────────────────────────────────────────

def test_add_and_remove_attendee():
    _seed_users()
    event_id = create_user_event(_make_event())

    assert add_attendee_to_user_event(str(event_id), 200) is True
    event = get_unsafe_user_event(str(event_id))
    assert len(event.attendees) == 1
    assert event.attendees[0].userId == 200

    # Adding same user again should be idempotent
    assert add_attendee_to_user_event(str(event_id), 200) is True
    event = get_unsafe_user_event(str(event_id))
    assert len(event.attendees) == 1

    assert remove_attendee_from_user_event(str(event_id), 200) is True
    event = get_unsafe_user_event(str(event_id))
    assert len(event.attendees) == 0


def test_max_attendees_enforced():
    _seed_users()
    event_id = create_user_event(_make_event(maxAttendees=1))

    assert add_attendee_to_user_event(str(event_id), 200) is True
    assert add_attendee_to_user_event(str(event_id), 300) is False

    event = get_unsafe_user_event(str(event_id))
    assert len(event.attendees) == 1


# ── Host management ──────────────────────────────────────────────────────────

def test_add_host_from_suggested():
    _seed_users()
    event_id = create_user_event(_make_event(suggested_hosts=[{"userId": 200}]))

    event = get_unsafe_user_event(str(event_id))
    assert len(event.suggested_hosts) == 1
    assert len(event.hosts) == 0

    assert add_user_as_host_to_user_event(str(event_id), 200) is True

    event = get_unsafe_user_event(str(event_id))
    assert len(event.hosts) == 1
    assert len(event.suggested_hosts) == 0


def test_remove_host():
    _seed_users()
    event_id = create_user_event(_make_event(hosts=[{"userId": 200}]))

    assert remove_user_from_hosts_of_user_event(str(event_id), 200) is True
    event = get_unsafe_user_event(str(event_id))
    assert len(event.hosts) == 0


def test_invited_to_host_query():
    _seed_users()
    create_user_event(_make_event(suggested_hosts=[{"userId": 200}]))

    invited = get_unsafe_user_events_user_is_invited_to_host(200)
    assert len(invited) == 1

    not_invited = get_unsafe_user_events_user_is_invited_to_host(300)
    assert len(not_invited) == 0


def test_remove_host_invitation():
    _seed_users()
    event_id = create_user_event(_make_event(suggested_hosts=[{"userId": 200}]))

    assert remove_user_host_invitation_from_user_event(str(event_id), 200) is True
    event = get_unsafe_user_event(str(event_id))
    assert len(event.suggested_hosts) == 0


# ── Reports ───────────────────────────────────────────────────────────────────

def test_add_and_update_report():
    _seed_users()
    event_id = create_user_event(_make_event())

    assert add_or_update_report_on_user_event(str(event_id), 200, "Bad") is True
    event = get_unsafe_user_event(str(event_id))
    assert len(event.reports) == 1
    assert event.reports[0].text == "Bad"

    # Update same user's report
    assert add_or_update_report_on_user_event(str(event_id), 200, "Very bad") is True
    event = get_unsafe_user_event(str(event_id))
    assert len(event.reports) == 1
    assert event.reports[0].text == "Very bad"


def test_remove_report():
    _seed_users()
    event_id = create_user_event(_make_event())
    add_or_update_report_on_user_event(str(event_id), 200, "Bad")

    assert remove_report_from_user_event(str(event_id), 200) is True
    event = get_unsafe_user_event(str(event_id))
    assert len(event.reports) == 0


# ── Event with location ──────────────────────────────────────────────────────

def test_event_with_location():
    _seed_users()
    event_id = create_user_event(_make_event(location={
        "description": "Conference room",
        "address": "123 Main St",
        "marker": "📍",
        "latitude": 59.33,
        "longitude": 18.07,
    }))

    event = get_unsafe_user_event(str(event_id))
    assert event.location is not None
    assert event.location.description == "Conference room"
    assert event.location.latitude == 59.33
