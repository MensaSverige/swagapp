"""Tests for the member calendar sync.

Covers the unified `events` table that replaced the MongoDB `unifiedevents`
collection, the MemberCalendarEvent to unified Event mapping, and the timezone
handling the `timestamptz` columns depend on.
"""

import datetime

from v1.db.database import get_session
from v1.db.tables import EventTable
from v1.events.events_model import EventSource, ShowAttendees
from v1.member_calendar.calendar_model import MemberCalendarEvent
from v1.member_calendar.calendar_db import (
    store_member_calendar_events,
    get_all_member_calendar_events,
    get_member_calendar_events_since,
    delete_member_calendar_event,
    clear_member_calendar_events,
    _utc,
)
from v1.member_calendar.ips_source import row_to_event
from v1.utilities import get_current_time_zone


def _event(source_id="1", title="Manadsmote", **kw):
    """A MemberCalendarEvent with the shape `row_to_event` produces."""
    base = dict(
        source_id=source_id,
        title=title,
        description="Regular monthly member meeting",
        location="Stockholm",
        # Naive, as MySQL hands it over: Swedish local wall clock.
        start=datetime.datetime(2026, 7, 15, 19, 0, 0),
        end=datetime.datetime(2026, 7, 15, 21, 0, 0),
        created=datetime.datetime(2026, 6, 1, 12, 0, 0),
        last_modified=datetime.datetime(2026, 6, 2, 12, 0, 0),
        organizer=None,
        url="https://medlem.mensa.se/calendar/event/1/",
    )
    base.update(kw)
    return MemberCalendarEvent(**base)


# -- Storage ------------------------------------------------------------------

def test_store_inserts_rows_tagged_with_the_source():
    assert store_member_calendar_events([_event(source_id="a"), _event(source_id="b")]) == 2
    with get_session() as session:
        rows = session.query(EventTable).all()
    assert len(rows) == 2
    assert {r.source for r in rows} == {"calendar"}


def test_store_upserts_on_source_and_source_id():
    """A re-sync updates in place instead of duplicating.

    This is what the unique (source, source_id) constraint replaces: MongoDB
    enforced the same thing with a compound index on the same pair.
    """
    store_member_calendar_events([_event(source_id="same", title="Original")])
    store_member_calendar_events([_event(source_id="same", title="Renamed", location="Goteborg")])

    with get_session() as session:
        rows = session.query(EventTable).all()
    assert len(rows) == 1
    assert rows[0].name == "Renamed"
    assert rows[0].location_description == "Goteborg"


def test_store_skips_bad_event_without_losing_the_batch():
    """One unwritable event must not discard the rest of the sync."""
    bad = _event(source_id="bad")
    # `name` is NOT NULL; bypass pydantic to reach the DB constraint.
    object.__setattr__(bad, "title", None)

    assert store_member_calendar_events([_event(source_id="good-a"), bad, _event(source_id="good-b")]) == 2
    with get_session() as session:
        ids = {r.source_id for r in session.query(EventTable).all()}
    assert ids == {"good-a", "good-b"}


def test_other_sources_in_the_table_are_left_alone():
    """The unified table is shared, so every query is scoped by source."""
    store_member_calendar_events([_event(source_id="mine")])
    with get_session() as session:
        session.add(EventTable(
            source=EventSource.user.value, source_id="99", name="Someone else's event",
            start=datetime.datetime(2026, 7, 15, 19, 0, 0, tzinfo=datetime.timezone.utc),
        ))
        session.commit()

    assert [e.sourceId for e in get_all_member_calendar_events()] == ["mine"]
    assert clear_member_calendar_events() == 1
    with get_session() as session:
        remaining = session.query(EventTable).all()
    assert [r.source for r in remaining] == [EventSource.user.value]


# -- Retrieval and mapping ----------------------------------------------------

def test_get_all_returns_unified_events():
    store_member_calendar_events([_event(source_id="42", title="Arsmote")])
    events = get_all_member_calendar_events()

    assert len(events) == 1
    event = events[0]
    assert event.source == EventSource.calendar
    assert event.sourceId == "42"
    assert event.id == "cal42"
    assert event.name == "Arsmote"
    assert event.official is True
    # Calendar events are read-only: nobody can attend or book them.
    assert event.attending is False
    assert event.bookable is False
    assert event.attendees == []
    assert event.showAttendees == ShowAttendees.none
    assert event.extras["url"] == "https://medlem.mensa.se/calendar/event/1/"


def test_event_id_follows_the_source_prefix_convention():
    """cal{id}, alongside ext{id} for external and usr{id} for user events."""
    store_member_calendar_events([_event(source_id="12345")])
    assert get_all_member_calendar_events()[0].id == "cal12345"


def test_event_id_is_stable_across_syncs():
    store_member_calendar_events([_event(source_id="stable")])
    first = get_all_member_calendar_events()[0].id
    store_member_calendar_events([_event(source_id="stable", title="Changed title")])
    assert get_all_member_calendar_events()[0].id == first


def test_organizer_becomes_a_host():
    store_member_calendar_events([_event(source_id="hosted", organizer="Pontus")])
    assert [h.fullName for h in get_all_member_calendar_events()[0].hosts] == ["Pontus"]


def test_missing_organizer_leaves_hosts_empty():
    store_member_calendar_events([_event(source_id="unhosted", organizer=None)])
    assert get_all_member_calendar_events()[0].hosts == []


# -- The `since` filter -------------------------------------------------------

def test_get_since_excludes_earlier_events():
    store_member_calendar_events([
        _event(source_id="old", start=datetime.datetime(2026, 1, 10, 19, 0, 0)),
        _event(source_id="new", start=datetime.datetime(2026, 9, 10, 19, 0, 0)),
    ])
    events = get_member_calendar_events_since(datetime.datetime(2026, 6, 1, 0, 0, 0))
    assert [e.sourceId for e in events] == ["new"]


def test_get_since_compares_in_one_timezone_frame():
    """An event earlier the same evening must fall outside the cutoff.

    Stored values and the cutoff are both normalized to UTC. Storing a
    Stockholm-offset value while comparing a UTC cutoff would over-match by the
    offset (2h in summer) and wrongly include this event.
    """
    store_member_calendar_events([_event(source_id="17h", start=datetime.datetime(2026, 7, 15, 17, 0, 0))])
    assert get_member_calendar_events_since(datetime.datetime(2026, 7, 15, 18, 0, 0)) == []
    assert len(get_member_calendar_events_since(datetime.datetime(2026, 7, 15, 16, 0, 0))) == 1


def test_get_since_accepts_an_already_aware_cutoff():
    """`list_unified_events` passes an aware datetime from get_current_time()."""
    store_member_calendar_events([_event(source_id="aware", start=datetime.datetime(2026, 7, 15, 19, 0, 0))])
    cutoff = get_current_time_zone().localize(datetime.datetime(2026, 7, 15, 18, 0, 0))
    assert len(get_member_calendar_events_since(cutoff)) == 1


# -- Timezone normalization ---------------------------------------------------

def test_naive_times_are_localized_not_read_as_utc():
    """19:00 Swedish local is 17:00Z in July, not 19:00Z."""
    stored = _utc(datetime.datetime(2026, 7, 15, 19, 0, 0))
    assert stored.utcoffset() == datetime.timedelta(0)
    assert stored == datetime.datetime(2026, 7, 15, 17, 0, 0, tzinfo=datetime.timezone.utc)


def test_winter_offset_differs_from_summer():
    """The offset is looked up per date, not assumed constant."""
    assert _utc(datetime.datetime(2026, 7, 15, 19, 0, 0)).hour == 17  # CEST, +02:00
    assert _utc(datetime.datetime(2026, 1, 15, 19, 0, 0)).hour == 18  # CET,  +01:00


def test_already_aware_times_are_preserved():
    aware = datetime.datetime(2026, 7, 15, 12, 0, 0, tzinfo=datetime.timezone.utc)
    assert _utc(aware) == aware


def test_utc_passes_none_through():
    assert _utc(None) is None


def test_optional_datetimes_may_be_absent():
    store_member_calendar_events([_event(source_id="sparse", end=None, created=None, last_modified=None)])
    assert get_all_member_calendar_events()[0].end is None


def test_source_timestamps_are_kept_apart_from_sync_timestamps():
    """source_created_at is the member site's clock; created_at is ours."""
    store_member_calendar_events([_event(source_id="stamped")])
    with get_session() as session:
        row = session.query(EventTable).filter_by(source_id="stamped").one()
        assert row.source_created_at is not None
        assert row.created_at is not None
        assert row.source_created_at != row.created_at


# -- Reading rows out of the source database ----------------------------------

def test_row_to_event_maps_a_mysql_row():
    event = row_to_event({
        "event_id": 77,
        "event_title": "Pub",
        "event_content": "<p>Kom &amp; hang</p>",
        "event_location": "Malmo",
        "event_start_date": datetime.datetime(2026, 7, 15, 19, 0, 0),
        "event_end_date": None,
        "event_saved": None,
        "event_last_update": None,
    })
    assert event.source_id == "77"
    assert event.title == "Pub"
    # HTML tags and entities are reduced to plain text.
    assert event.description == "Kom & hang"
    assert event.url == "https://medlem.mensa.se/calendar/event/77/"


def test_row_without_a_start_date_is_skipped():
    """An event with no start has nothing to show against."""
    assert row_to_event({"event_id": 1, "event_title": "x", "event_start_date": None}) is None


def test_row_without_a_title_gets_a_placeholder():
    event = row_to_event({
        "event_id": 2,
        "event_title": None,
        "event_start_date": datetime.datetime(2026, 7, 15, 19, 0, 0),
    })
    assert event.title == "Untitled Event"


# -- Deletion -----------------------------------------------------------------

def test_delete_by_source_id():
    store_member_calendar_events([_event(source_id="keep"), _event(source_id="drop")])
    assert delete_member_calendar_event("drop") is True
    assert [e.sourceId for e in get_all_member_calendar_events()] == ["keep"]


def test_delete_missing_source_id_reports_false():
    assert delete_member_calendar_event("never-stored") is False


def test_clear_returns_count():
    store_member_calendar_events([_event(source_id="x"), _event(source_id="y")])
    assert clear_member_calendar_events() == 2
    assert get_all_member_calendar_events() == []
