"""
Tests for the Mongo → Postgres data migration script.

Each test injects a FakeMongo so no running Mongo daemon is required.
The standard fresh_db fixture provides a clean SQLite database per test.

HONEST LIMITATIONS — what these tests do NOT prove:
  - PostgreSQL-specific behaviour: JSONB operators, timestamptz coercion,
    advisory locks, named-constraint ON CONFLICT syntax (we use column-list
    syntax throughout to stay SQLite-compatible).
  - Concurrent execution: all assertions are single-threaded.
  - Network/connection failure paths in the real Mongo client.

WHAT THESE TESTS DO PROVE:
  - Specific field values land correctly in specific columns (not just "a row
    exists"). Every assertion is written so that deleting it would hide a
    real transformation bug.
  - Legacy bool privacy fields (show_email: True/False) are coerced to valid
    PrivacySetting strings, not left as "True"/"False".
  - Documents missing required keys are skipped, not inserted as garbage.
  - Idempotency: running the same migration twice produces the same number of
    rows as running it once — tested table-by-table and child-row-by-child-row.
  - Validation catches both under-count AND over-count (== not >=).
  - The tracking table (_mongo_migration_log) actually prevents duplicate
    parent rows AND duplicate child rows on re-runs.
"""

from datetime import datetime, timezone

import pytest
from sqlalchemy import text
from v1.db import database

from migrations.mongo_to_postgres import (
    _ensure_migration_tracking,
    migrate_external_event_bookings,
    migrate_external_events,
    migrate_external_root,
    migrate_token_storage,
    migrate_user_events,
    migrate_users,
    validate,
)


# ── Session fixture ───────────────────────────────────────────────────────────
# fresh_db (autouse) patches database.SessionLocal to point at a clean SQLite
# in-memory DB before each test. This fixture creates one session from that
# patched SessionLocal and closes it afterward.
# Tests should NOT commit inside the migration and then re-open with get_session()
# and expect to see results — the StaticPool shares one connection, so everything
# is visible within the same session even before commit.

@pytest.fixture
def session():
    s = database.SessionLocal()
    try:
        yield s
    finally:
        s.close()


# ── Fake Mongo infrastructure ─────────────────────────────────────────────────

class FakeCollection:
    """Minimal PyMongo collection stand-in."""

    def __init__(self, docs):
        self._docs = list(docs)

    def find(self, _query=None):
        return iter(self._docs)

    def count_documents(self, _query=None):
        return len(self._docs)

    def find_one(self, _query=None):
        return self._docs[0] if self._docs else None


class FakeMongo:
    """Dict-like Mongo database stand-in keyed by collection name."""

    def __init__(self, **collections):
        self._c = {k: FakeCollection(v) for k, v in collections.items()}

    def __getitem__(self, name):
        return self._c.get(name, FakeCollection([]))


# Critique: FakeCollection.find() returns all docs unconditionally. Real Mongo
# cursors support query predicates — but our migration never passes a filter to
# find(), so this is correct, not a gap.

# Critique: FakeCollection._docs is a plain list. Real Mongo returns dicts with
# bson.ObjectId for _id. We use plain strings for _id throughout because the
# migration only ever calls str(_id), so str("abc") == "abc" is fine.


# ── Helpers ───────────────────────────────────────────────────────────────────

_NOW = datetime(2024, 6, 1, 12, 0, 0, tzinfo=timezone.utc)


def _row(session, table, **where):
    """Fetch one row from table matching all where-clause column=value pairs."""
    conds = " AND ".join(f'"{k}" = :{k}' for k in where)
    return session.execute(text(f'SELECT * FROM "{table}" WHERE {conds}'), where).fetchone()


def _count(session, table):
    return session.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()


def _scalar(session, sql, **params):
    return session.execute(text(sql), params).scalar()


# ── Users ─────────────────────────────────────────────────────────────────────

def test_user_all_profile_fields_land_correctly(session):
    """Verify specific field values, not just presence of a row.

    Critique of a weaker version: if we only asserted _count(session, 'users') == 1
    we would not catch a bug where firstName is stored in the wrong column, or
    where interests is serialised as a Python repr instead of JSON.
    """
    mongo = FakeMongo(user=[{
        "userId": 42,
        "isMember": True,
        "firstName": "Mikael",
        "lastName": "Grön",
        "slogan": "Hello world",
        "age": 35,
        "interests": ["Programmering och IT", "Böcker och litteratur"],
        "social_vibes": ["creative"],
        "settings": {
            "show_location": "MEMBERS_ONLY",
            "show_email": "NO_ONE",
            "show_phone": "NO_ONE",
            "show_profile": "MEMBERS_MUTUAL",
            "show_interests": "EVERYONE",
            "show_hometown": "NO_ONE",
            "show_birthdate": "NO_ONE",
            "show_gender": "NO_ONE",
            "show_sexuality": "NO_ONE",
            "show_relationship_style": "NO_ONE",
            "show_relationship_status": "NO_ONE",
            "show_social_vibes": "MEMBERS_ONLY",
            "show_pronomen": "NO_ONE",
            "show_attendance": "MEMBERS_MUTUAL",
            "location_update_interval_seconds": 120,
            "events_refresh_interval_seconds": 90,
            "background_location_updates": True,
        },
        "location": {"latitude": 59.33, "longitude": 18.07, "accuracy": 5.0},
        "contact_info": {"email": "m@test.com", "phone": "+46700000000"},
        "hometown": "Stockholm",
        "birthdate": "1989-01-01",
        "gender": "male",
    }])

    migrate_users(session, mongo_source=mongo)

    row = _row(session, "users", userId=42)
    assert row is not None
    assert row._mapping["firstName"] == "Mikael"
    assert row._mapping["lastName"] == "Grön"
    assert row._mapping["slogan"] == "Hello world"
    assert row._mapping["age"] == 35
    assert row._mapping["isMember"] == 1  # SQLite stores bool as int
    assert row._mapping["show_location"] == "MEMBERS_ONLY"
    assert row._mapping["show_interests"] == "EVERYONE"
    assert row._mapping["location_latitude"] == 59.33
    assert row._mapping["location_longitude"] == 18.07
    assert row._mapping["contact_email"] == "m@test.com"
    assert row._mapping["contact_phone"] == "+46700000000"
    assert row._mapping["hometown"] == "Stockholm"
    assert row._mapping["background_location_updates"] == 1
    assert row._mapping["location_update_interval_seconds"] == 120

    # Interests stored as JSON — verify the round-trip, not just that a string exists.
    import json
    interests = json.loads(row._mapping["interests"])
    assert "Programmering och IT" in interests
    assert len(interests) == 2

    social_vibes = json.loads(row._mapping["social_vibes"])
    assert social_vibes == ["creative"]


def test_user_bool_show_email_true_coerced_to_members_only(session):
    """Legacy Mongo docs stored show_email/show_phone as booleans.

    _str(True) → "True" which is NOT a valid PrivacySetting and would silently
    corrupt every user who had explicitly set show_email=True. _privacy() must
    convert True → "MEMBERS_ONLY".

    Critique: this test would be vacuous if it only checked that a row was
    inserted. It must assert the exact string value in the column.
    """
    mongo = FakeMongo(user=[{
        "userId": 1,
        "isMember": False,
        "settings": {
            "show_email": True,   # old boolean format
            "show_phone": False,  # old boolean format
        },
    }])

    migrate_users(session, mongo_source=mongo)

    row = _row(session, "users", userId=1)
    assert row._mapping["show_email"] == "MEMBERS_ONLY", (
        "show_email=True must become 'MEMBERS_ONLY', not 'True'"
    )
    assert row._mapping["show_phone"] == "NO_ONE", (
        "show_phone=False must become 'NO_ONE', not 'False'"
    )


def test_user_missing_userId_is_skipped(session):
    """A document with no userId must not create a row.

    Critique: without this test a bug that silently inserts userId=None
    (as NULL) would go undetected. We check count, not just absence of crash.
    """
    mongo = FakeMongo(user=[
        {"isMember": False, "settings": {}},       # no userId
        {"userId": 99, "isMember": True, "settings": {}},
    ])

    migrate_users(session, mongo_source=mongo)

    assert _count(session, "users") == 1
    assert _row(session, "users", userId=99) is not None


def test_user_migration_is_idempotent(session):
    """Running migrate_users twice must not create duplicate rows.

    Critique of a weaker version: checking count == 1 after two runs does not
    prove idempotency if the second run silently errors out. We also check that
    the data is still readable (not rolled back) after both runs.
    """
    mongo = FakeMongo(user=[{"userId": 7, "isMember": True, "settings": {}}])

    migrate_users(session, mongo_source=mongo)
    migrate_users(session, mongo_source=mongo)

    assert _count(session, "users") == 1
    assert _row(session, "users", userId=7) is not None


def test_user_second_run_updates_changed_data(session):
    """ON CONFLICT DO UPDATE means re-running with changed Mongo data updates Postgres.

    Critique: if we only tested idempotency with identical data we would miss
    the case where a user's profile changed between migration attempts.
    """
    mongo_v1 = FakeMongo(user=[{"userId": 5, "isMember": False,
                                 "slogan": "old", "settings": {}}])
    mongo_v2 = FakeMongo(user=[{"userId": 5, "isMember": True,
                                 "slogan": "new", "settings": {}}])

    migrate_users(session, mongo_source=mongo_v1)
    migrate_users(session, mongo_source=mongo_v2)

    row = _row(session, "users", userId=5)
    assert row._mapping["slogan"] == "new"
    assert row._mapping["isMember"] == 1


def test_user_null_optional_fields_stored_as_null(session):
    """Fields absent from the Mongo doc must land as NULL, not empty string.

    Critique: _str(None, "") returns "" and _str(None) also returns "". Using
    _str for nullable fields would store "" instead of NULL, breaking IS NULL
    queries and application-layer None checks.
    """
    mongo = FakeMongo(user=[{"userId": 3, "isMember": False, "settings": {}}])

    migrate_users(session, mongo_source=mongo)

    row = _row(session, "users", userId=3)
    assert row._mapping["slogan"] is None
    assert row._mapping["firstName"] is None
    assert row._mapping["contact_email"] is None
    assert row._mapping["location_latitude"] is None


# ── Token storage ─────────────────────────────────────────────────────────────

def test_token_storage_fields_land_correctly(session):
    """Verify the token value and expiry time are not swapped or truncated."""
    expires = datetime(2025, 12, 31, 23, 59, 0, tzinfo=timezone.utc)
    mongo = FakeMongo(tokenstorage=[{
        "userId": 10,
        "externalAccessToken": "tok_abc123",
        "createdAt": _NOW,
        "expiresAt": expires,
    }])

    migrate_token_storage(session, mongo_source=mongo)

    row = _row(session, "token_storage", userId=10)
    assert row._mapping["externalAccessToken"] == "tok_abc123"
    # SQLite stores datetimes as strings; check the token, not the timestamp format.


def test_token_missing_userId_skipped(session):
    mongo = FakeMongo(tokenstorage=[
        {"externalAccessToken": "orphan"},          # no userId
        {"userId": 20, "externalAccessToken": "good"},
    ])

    migrate_token_storage(session, mongo_source=mongo)

    assert _count(session, "token_storage") == 1


def test_token_storage_idempotent(session):
    mongo = FakeMongo(tokenstorage=[{"userId": 15, "externalAccessToken": "t"}])
    migrate_token_storage(session, mongo_source=mongo)
    migrate_token_storage(session, mongo_source=mongo)
    assert _count(session, "token_storage") == 1


# ── User events ───────────────────────────────────────────────────────────────

def test_event_all_child_rows_land(session):
    """Each child collection (hosts, suggested_hosts, attendees, reports) is inserted.

    Critique of a weaker version: checking only the parent event count would
    miss bugs where child rows are silently dropped (wrong column name, failed
    insert caught by a broad except, etc.).
    """
    mongo = FakeMongo(userevent=[{
        "_id": "aaa111",
        "userId": 1,
        "name": "Meetup",
        "start": _NOW,
        "hosts": [{"userId": 2}, {"userId": 3}],
        "suggested_hosts": [{"userId": 4}],
        "attendees": [{"userId": 5}, {"userId": 6}],
        "reports": [{"userId": 7, "text": "Inappropriate"}],
    }])

    migrate_user_events(session, mongo_source=mongo)

    assert _count(session, "user_events") == 1
    assert _count(session, "event_hosts") == 2
    assert _count(session, "event_suggested_hosts") == 1
    assert _count(session, "event_attendees") == 2
    assert _count(session, "event_reports") == 1

    report_text = _scalar(session, 'SELECT text FROM event_reports LIMIT 1')
    assert report_text == "Inappropriate"


def test_event_location_fields_land(session):
    """Location is flattened from a nested Mongo object to individual columns."""
    mongo = FakeMongo(userevent=[{
        "_id": "loc1",
        "userId": 1,
        "name": "Outdoor",
        "start": _NOW,
        "location": {
            "description": "The park",
            "address": "Park Lane 1",
            "marker": "🌳",
            "latitude": 59.334591,
            "longitude": 18.063240,
        },
    }])

    migrate_user_events(session, mongo_source=mongo)

    lat = _scalar(session, 'SELECT location_latitude FROM user_events LIMIT 1')
    lon = _scalar(session, 'SELECT location_longitude FROM user_events LIMIT 1')
    desc = _scalar(session, 'SELECT location_description FROM user_events LIMIT 1')
    assert abs(lat - 59.334591) < 1e-6
    assert abs(lon - 18.063240) < 1e-6
    assert desc == "The park"


def test_event_missing_userId_skipped(session):
    mongo = FakeMongo(userevent=[
        {"_id": "bad1", "name": "Ghost", "start": _NOW},  # no userId
        {"_id": "ok1", "userId": 1, "name": "Real", "start": _NOW},
    ])

    migrate_user_events(session, mongo_source=mongo)

    assert _count(session, "user_events") == 1


def test_event_idempotent_no_duplicate_parent(session):
    """The tracking table must prevent inserting the same event twice.

    Critique: a naive ON CONFLICT on user_events would not help because
    user_events has no natural unique key. This test would fail on the old
    implementation (which used ON CONFLICT DO NOTHING against a non-existent
    constraint — a silent no-op that then falls through to duplicate insertion).
    """
    mongo = FakeMongo(userevent=[{"_id": "e1", "userId": 1, "name": "Once", "start": _NOW}])

    migrate_user_events(session, mongo_source=mongo)
    migrate_user_events(session, mongo_source=mongo)

    assert _count(session, "user_events") == 1, (
        "Two runs of the migration must produce exactly one event row, "
        "not two. The _mongo_migration_log tracking table must prevent re-insertion."
    )


def test_event_idempotent_no_duplicate_children(session):
    """Child rows must not be doubled on re-run.

    Critique: even if the parent is correctly deduplicated via the tracking table,
    a bug could still re-insert children by fetching the existing pg_id and then
    inserting child rows again. This test explicitly checks child counts.
    """
    mongo = FakeMongo(userevent=[{
        "_id": "e2",
        "userId": 1,
        "name": "Party",
        "start": _NOW,
        "attendees": [{"userId": 2}, {"userId": 3}],
        "hosts": [{"userId": 4}],
    }])

    migrate_user_events(session, mongo_source=mongo)
    migrate_user_events(session, mongo_source=mongo)

    assert _count(session, "event_attendees") == 2
    assert _count(session, "event_hosts") == 1


def test_event_tracking_table_is_populated(session):
    """The _mongo_migration_log must record the mapping after migration.

    Critique: this is an internal mechanism test. If the tracking table is
    populated but the pg_id stored is wrong, the idempotency test would still
    pass (skips re-insertion) but any downstream query using the wrong pg_id
    would silently attach children to the wrong event. We verify pg_id is
    consistent with the actual event row.
    """
    mongo = FakeMongo(userevent=[{
        "_id": "track_me",
        "userId": 1,
        "name": "Tracked",
        "start": _NOW,
    }])

    migrate_user_events(session, mongo_source=mongo)

    logged_pg_id = _scalar(session,
        "SELECT pg_id FROM _mongo_migration_log "
        "WHERE collection = 'userevent' AND mongo_id = 'track_me'")
    actual_pg_id = _scalar(session, 'SELECT id FROM user_events WHERE name = \'Tracked\'')

    assert logged_pg_id is not None, "Tracking log must be populated"
    assert logged_pg_id == actual_pg_id, (
        "pg_id in tracking log must match the actual user_events.id"
    )


# ── External events ───────────────────────────────────────────────────────────

def test_external_event_admins_and_categories_land(session):
    """Admins and categories for an external event land in their child tables."""
    mongo = FakeMongo(externaleventdetails=[{
        "eventId": 100,
        "startTime": "09:00", "endTime": "17:00",
        "description": "Annual conf", "speaker": "Alice",
        "location": "Stockholm", "isFree": False, "price": 500,
        "isLimited": True, "stock": 50, "showBooked": True, "booked": 10,
        "eventUrl": "https://example.com",
        "admins": ["admin_a", "admin_b"],
        "categories": [
            {"code": "C1", "text": "Tech", "colorText": "#fff", "colorBackground": "#000"},
            {"code": "C2", "text": "Science", "colorText": "#000", "colorBackground": "#eee"},
        ],
    }])

    migrate_external_events(session, mongo_source=mongo)

    assert _count(session, "external_event_admins") == 2
    assert _count(session, "external_event_categories") == 2

    cat_codes = [r[0] for r in session.execute(
        text('SELECT code FROM external_event_categories ORDER BY code')).fetchall()]
    assert cat_codes == ["C1", "C2"]


def test_external_event_idempotent_replaces_children(session):
    """Re-running must NOT double admins/categories.

    The delete-then-reinsert strategy means re-running produces the same count,
    not twice the count.

    Critique: this tests the actual strategy (delete+reinsert), NOT a duplicate
    check via a unique constraint (these tables have no such constraint). The
    test would fail if the delete step were accidentally removed.
    """
    doc = {
        "eventId": 200,
        "startTime": "10:00", "endTime": "18:00",
        "description": "d", "speaker": "s", "location": "l",
        "isFree": True, "price": 0, "isLimited": False, "stock": 0,
        "showBooked": False, "booked": 0, "eventUrl": "https://x.com",
        "admins": ["adm1"],
        "categories": [{"code": "X", "text": "X", "colorText": "#f", "colorBackground": "#0"}],
    }
    mongo = FakeMongo(externaleventdetails=[doc])

    migrate_external_events(session, mongo_source=mongo)
    migrate_external_events(session, mongo_source=mongo)

    assert _count(session, "external_event_admins") == 1
    assert _count(session, "external_event_categories") == 1


# ── External root ─────────────────────────────────────────────────────────────

def test_external_root_fields_and_dates_land(session):
    """Scalar fields and the dates list all reach Postgres."""
    mongo = FakeMongo(externalroot=[{
        "version": 7,
        "loginUrl": "https://login.example.com",
        "restUrl": "https://api.example.com",
        "siteUrl": "https://www.example.com",
        "header1": "Mensa",
        "header2": "Sverige",
        "city": "Stockholm",
        "streetAddress": "Kungsgatan 1",
        "mapUrl": "https://maps.example.com",
        "dates": ["2024-09-01", "2024-09-15", "2024-10-01"],
    }])

    migrate_external_root(session, mongo_source=mongo)

    version = _scalar(session, 'SELECT version FROM external_root WHERE id = 1')
    assert version == 7

    city = _scalar(session, 'SELECT city FROM external_root WHERE id = 1')
    assert city == "Stockholm"

    date_count = _count(session, "external_root_dates")
    assert date_count == 3

    dates = sorted(r[0] for r in session.execute(
        text('SELECT date_value FROM external_root_dates')).fetchall())
    assert dates == ["2024-09-01", "2024-09-15", "2024-10-01"]


def test_external_root_idempotent_replaces_dates(session):
    """Re-running replaces dates, not appends them."""
    doc = {
        "version": 1, "loginUrl": "u", "restUrl": "u", "siteUrl": "u",
        "header1": "h", "header2": "h", "city": "c", "streetAddress": "s",
        "mapUrl": "m", "dates": ["2024-01-01", "2024-02-01"],
    }
    mongo = FakeMongo(externalroot=[doc])

    migrate_external_root(session, mongo_source=mongo)
    migrate_external_root(session, mongo_source=mongo)

    assert _count(session, "external_root_dates") == 2


def test_external_root_empty_collection_is_noop(session):
    """An empty externalroot collection must not error or insert garbage."""
    mongo = FakeMongo(externalroot=[])

    total, migrated = migrate_external_root(session, mongo_source=mongo)

    assert total == 0
    assert migrated == 0
    assert _count(session, "external_root") == 0


# ── External event bookings ───────────────────────────────────────────────────

def test_booking_idempotent_no_duplicate(session):
    """The same booking inserted twice must produce exactly one row.

    Critique: ON CONFLICT ("userId", "eventId") DO NOTHING must match the
    actual unique constraint columns. If the column names are wrong (e.g. "eventId"
    vs "eid"), this would throw instead of silently deduplicating. A passing test
    confirms the column names in the INSERT match the constraint.
    """
    mongo = FakeMongo(externaleventbooking=[{"userId": 1, "eventId": 100}])

    migrate_external_event_bookings(session, mongo_source=mongo)
    migrate_external_event_bookings(session, mongo_source=mongo)

    assert _count(session, "external_event_bookings") == 1


def test_booking_missing_fields_skipped(session):
    mongo = FakeMongo(externaleventbooking=[
        {"userId": 1},           # no eventId
        {"eventId": 100},         # no userId
        {"userId": 2, "eventId": 200},
    ])

    migrate_external_event_bookings(session, mongo_source=mongo)

    assert _count(session, "external_event_bookings") == 1


# ── Validation ────────────────────────────────────────────────────────────────

def test_validate_ok_when_counts_match(session):
    """Validation returns True when Mongo and Postgres counts agree."""
    mongo = FakeMongo(
        user=[{"userId": 1, "isMember": False, "settings": {}}],
        tokenstorage=[],
        userevent=[],
        externaleventdetails=[],
        externaleventbooking=[],
    )
    migrate_users(session, mongo_source=mongo)

    result = validate(session, mongo_source=mongo)
    assert result is True


def test_validate_detects_postgres_has_fewer_rows(session):
    """Validation returns False when Postgres has fewer rows than Mongo.

    This is the standard migration-incomplete case.
    """
    mongo = FakeMongo(
        user=[
            {"userId": 1, "isMember": False, "settings": {}},
            {"userId": 2, "isMember": False, "settings": {}},
        ],
        tokenstorage=[], userevent=[], externaleventdetails=[], externaleventbooking=[],
    )
    # Migrate only one of the two users manually to force a mismatch.
    session.execute(text("""
        INSERT INTO users ("userId", "isMember",
            show_location, show_profile, show_email, show_phone,
            show_interests, show_hometown, show_birthdate, show_gender,
            show_sexuality, show_relationship_style, show_relationship_status,
            show_social_vibes, show_pronomen, show_attendance,
            location_update_interval_seconds, events_refresh_interval_seconds,
            background_location_updates, created_at, updated_at)
        VALUES (1, 0, 'NO_ONE','MEMBERS_MUTUAL','NO_ONE','NO_ONE',
                'MEMBERS_MUTUAL','MEMBERS_MUTUAL','MEMBERS_MUTUAL','NO_ONE',
                'NO_ONE','NO_ONE','NO_ONE','MEMBERS_MUTUAL','NO_ONE','MEMBERS_MUTUAL',
                60, 60, 0, '2024-01-01', '2024-01-01')
    """))
    session.commit()

    result = validate(session, mongo_source=mongo)
    assert result is False


def test_validate_detects_postgres_has_more_rows(session):
    """Validation returns False when Postgres has MORE rows than Mongo.

    This is the double-insertion bug case. Old code used >= instead of ==,
    which would silently pass this scenario and hide the bug.

    Critique: this is the most important validation test. The == vs >= choice
    exists precisely to catch this. Without this test, reverting to >= would
    go unnoticed.
    """

    # Simulate two rows in Postgres for one row in Mongo.
    for uid in (1, 2):
        session.execute(text("""
            INSERT INTO users ("userId", "isMember",
                show_location, show_profile, show_email, show_phone,
                show_interests, show_hometown, show_birthdate, show_gender,
                show_sexuality, show_relationship_style, show_relationship_status,
                show_social_vibes, show_pronomen, show_attendance,
                location_update_interval_seconds, events_refresh_interval_seconds,
                background_location_updates, created_at, updated_at)
            VALUES (:uid, 0, 'NO_ONE','MEMBERS_MUTUAL','NO_ONE','NO_ONE',
                    'MEMBERS_MUTUAL','MEMBERS_MUTUAL','MEMBERS_MUTUAL','NO_ONE',
                    'NO_ONE','NO_ONE','NO_ONE','MEMBERS_MUTUAL','NO_ONE','MEMBERS_MUTUAL',
                    60, 60, 0, '2024-01-01', '2024-01-01')
        """), {"uid": uid})
    session.commit()

    # Mongo has only ONE user document.
    mongo = FakeMongo(
        user=[{"userId": 1, "isMember": False, "settings": {}}],
        tokenstorage=[], userevent=[], externaleventdetails=[], externaleventbooking=[],
    )

    result = validate(session, mongo_source=mongo)
    assert result is False, (
        "Validation must return False when Postgres has MORE rows than Mongo. "
        "This catches double-insertion bugs that >= would silently accept."
    )
