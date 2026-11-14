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
        address="Klostergatan 11",
        city="Stockholm",
        postal_code="11122",
        country="SE",
        latitude=59.33,
        longitude=18.06,
        region="stockholm",
        region_slug="lf-stockholm-intern",
        region_id=7,
        # Naive, as MySQL hands it over: Swedish local wall clock.
        start=datetime.datetime(2026, 7, 15, 19, 0, 0),
        end=datetime.datetime(2026, 7, 15, 21, 0, 0),
        created=datetime.datetime(2026, 6, 1, 12, 0, 0, tzinfo=datetime.timezone.utc),
        last_modified=datetime.datetime(2026, 6, 2, 12, 0, 0, tzinfo=datetime.timezone.utc),
        organizer=None,
        organizer_id=None,
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
    store_member_calendar_events([_event(source_id="same", title="Renamed", location="Goteborg", city="Goteborg")])

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
    assert event.locationDescription == "Stockholm"
    assert event.address == "Klostergatan 11, 11122 Stockholm"
    assert (event.latitude, event.longitude) == (59.33, 18.06)
    assert event.extras["region"] == "stockholm"
    assert event.extras["regionSlug"] == "lf-stockholm-intern"
    assert event.extras["regionId"] == 7
    assert event.extras["city"] == "Stockholm"
    assert event.extras["postalCode"] == "11122"
    assert event.extras["country"] == "SE"


def test_coordinates_land_in_location_columns():
    store_member_calendar_events([_event(source_id="geo")])
    with get_session() as session:
        row = session.query(EventTable).filter_by(source_id="geo").one()
        assert (row.location_latitude, row.location_longitude) == (59.33, 18.06)
        assert row.extras["regionSlug"] == "lf-stockholm-intern"


def test_event_without_structured_location_falls_back_to_free_text():
    store_member_calendar_events([_event(
        source_id="plain", location="Somewhere", address=None, city=None,
        postal_code=None, latitude=None, longitude=None)])
    event = get_all_member_calendar_events()[0]
    assert event.locationDescription == "Somewhere"
    assert event.address == "Somewhere"
    assert event.latitude is None and event.longitude is None


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


def test_organizer_id_becomes_the_host_user_id():
    """A host the app can link to a profile, rather than a bare name."""
    store_member_calendar_events(
        [_event(source_id="hosted-id", organizer="Pontus", organizer_id=2003148)])
    hosts = get_all_member_calendar_events()[0].hosts
    assert [(h.userId, h.fullName) for h in hosts] == [(2003148, "Pontus")]


def test_organizer_without_a_membership_number_still_hosts():
    """Ten of the member site's 8799 members have no number. Keep their name."""
    store_member_calendar_events(
        [_event(source_id="hosted-anon", organizer="Pontus", organizer_id=None)])
    hosts = get_all_member_calendar_events()[0].hosts
    assert [(h.userId, h.fullName) for h in hosts] == [(0, "Pontus")]


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

def _row(**kw):
    base = {
        "event_id": 77,
        "event_title": "Pub",
        "event_content": "<p>Kom &amp; hang</p>",
        "event_location": None,
        "event_start_date": datetime.datetime(2026, 7, 15, 19, 0, 0),
        "event_end_date": None,
        "event_saved": None,
        "event_lastupdated": None,
        "event_calendar_id": 12,
        "cal_title_seo": "lma-örebro-intern",
        "organizer_name": None,
        "organizer_mensa_id": None,
    }
    base.update(kw)
    return base


_LOC = (
    '{"lat":%s,"long":%s,"addressLines":["Klostergatan 11"],'
    '"city":"Örebro","region":"","country":"SE","postalCode":"70218"}'
)


def test_row_to_event_maps_a_real_schema_row():
    event = row_to_event(_row())
    assert event.source_id == "77"
    assert event.title == "Pub"
    # HTML tags and entities are reduced to plain text.
    assert event.description == "Kom & hang"
    assert event.url == "https://medlem.mensa.se/calendar/event/77/"
    assert event.organizer is None
    assert event.region_id == 12


def test_location_json_with_coordinates():
    event = row_to_event(_row(event_location=_LOC % ("59.27", "15.21")))
    assert event.address == "Klostergatan 11"
    assert event.city == "Örebro"
    assert event.postal_code == "70218"
    assert event.country == "SE"
    assert event.latitude == 59.27
    assert event.longitude == 15.21
    assert event.location == "Örebro"


def test_location_json_with_null_coordinates():
    event = row_to_event(_row(event_location=_LOC % ("null", "null")))
    assert event.latitude is None and event.longitude is None
    assert event.city == "Örebro"


def test_empty_and_zero_coordinates_are_none():
    event = row_to_event(_row(event_location=_LOC % ('""', "0")))
    assert event.latitude is None and event.longitude is None


def test_null_location_means_no_location():
    event = row_to_event(_row(event_location=None))
    assert event.address is None and event.city is None
    assert event.latitude is None and event.location is None


def test_empty_or_invalid_location_is_tolerated():
    for raw in ("", "not json", "[1, 2]"):
        event = row_to_event(_row(event_location=raw))
        assert event.address is None and event.city is None


def test_multiple_address_lines_are_joined():
    raw = '{"addressLines":["Hus A","Gatan 1"],"city":"Lund"}'
    assert row_to_event(_row(event_location=raw)).address == "Hus A, Gatan 1"


def test_unix_timestamps_become_aware_utc():
    event = row_to_event(_row(event_saved=1780315200, event_lastupdated=1780401600))
    assert event.created == datetime.datetime(2026, 6, 1, 12, 0, 0, tzinfo=datetime.timezone.utc)
    assert event.last_modified == datetime.datetime(2026, 6, 2, 12, 0, 0, tzinfo=datetime.timezone.utc)
    assert event.created.utcoffset() == datetime.timedelta(0)


def test_zero_or_missing_timestamps_are_none():
    event = row_to_event(_row(event_saved=0, event_lastupdated=None))
    assert event.created is None and event.last_modified is None


def test_region_cleaning():
    cases = {
        "lma-örebro-intern": "örebro",
        "lf-stockholm-intern": "stockholm",
        "lf-väst-intern": "väst",
        "lf-väst-offentlig": "väst",
        "mensa-nationellt-intern": "mensa-nationellt",
        "årsträffen": "årsträffen",
    }
    for slug, region in cases.items():
        event = row_to_event(_row(cal_title_seo=slug))
        assert event.region == region, slug
        assert event.region_slug == slug


def test_missing_calendar_leaves_region_empty():
    event = row_to_event(_row(cal_title_seo=None, event_calendar_id=None))
    assert event.region is None and event.region_slug is None and event.region_id is None


def test_row_without_a_start_date_is_skipped():
    """An event with no start has nothing to show against."""
    assert row_to_event(_row(event_start_date=None)) is None


def test_row_to_event_reads_the_organizer():
    event = row_to_event(_row(organizer_name="Hans Brettschneider",
                              organizer_mensa_id=2003148))
    assert event.organizer == "Hans Brettschneider"
    assert event.organizer_id == 2003148


def test_zero_membership_number_is_none():
    """The column is 0, not NULL, for a member who has no number. 0 is nobody."""
    event = row_to_event(_row(organizer_name="Hans", organizer_mensa_id=0))
    assert event.organizer == "Hans"
    assert event.organizer_id is None


def test_blank_organizer_name_is_none():
    event = row_to_event(_row(organizer_name="   "))
    assert event.organizer is None


def test_events_query_joins_the_organizer():
    from v1.member_calendar.ips_source import EVENTS_QUERY
    assert "LEFT JOIN core_members m ON m.member_id = e.event_member_id" in EVENTS_QUERY
    assert "m.name AS organizer_name" in EVENTS_QUERY
    assert "m.mensa_id AS organizer_mensa_id" in EVENTS_QUERY
    # The member record also carries an email address and an IP. Neither has
    # any business in this app's database.
    assert "m.email" not in EVENTS_QUERY
    assert "ip_address" not in EVENTS_QUERY


def test_events_query_targets_real_tables():
    from v1.member_calendar.ips_source import EVENTS_QUERY
    assert "FROM calendar_events e" in EVENTS_QUERY
    assert "calendar_calendar_events" not in EVENTS_QUERY
    assert "e.event_lastupdated" in EVENTS_QUERY
    assert "LEFT JOIN calendar_calendars c ON c.cal_id = e.event_calendar_id" in EVENTS_QUERY


def test_row_without_a_title_gets_a_placeholder():
    event = row_to_event(_row(event_id=2, event_title=None))
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


# -- Approximate coordinates --------------------------------------------------

def _no_coords(**kw):
    return _event(latitude=None, longitude=None, **kw)


def test_explicit_coordinates_are_not_approximate(monkeypatch):
    from v1.google_maps_api import geocode_cache
    calls = []
    monkeypatch.setattr(geocode_cache, "geocode_address", lambda q: calls.append(q) or _place(1.0, 2.0))
    store_member_calendar_events([_event(source_id="exp")])
    with get_session() as session:
        row = session.query(EventTable).filter_by(source_id="exp").one()
        assert (row.location_latitude, row.location_longitude) == (59.33, 18.06)
        assert row.extras["locationApprox"] is False
    assert calls == []


def test_missing_coordinates_are_geocoded_from_postal_and_city(monkeypatch):
    from v1.google_maps_api import geocode_cache
    calls = []
    monkeypatch.setattr(geocode_cache, "geocode_address", lambda q: calls.append(q) or _place(59.27, 15.21))
    store_member_calendar_events([_no_coords(source_id="geo", postal_code="70218", city="Örebro", country="SE")])
    with get_session() as session:
        row = session.query(EventTable).filter_by(source_id="geo").one()
        assert (row.location_latitude, row.location_longitude) == (59.27, 15.21)
        assert row.extras["locationApprox"] is True
    assert calls == ["70218 Örebro, SE"]


def test_query_defaults_country_to_sverige(monkeypatch):
    from v1.google_maps_api import geocode_cache
    calls = []
    monkeypatch.setattr(geocode_cache, "geocode_address", lambda q: calls.append(q) or None)
    store_member_calendar_events([_no_coords(source_id="c", postal_code=None, city="Lund", country=None)])
    assert calls == ["Lund, Sverige"]


def test_failed_geocode_leaves_coordinates_empty(monkeypatch):
    from v1.google_maps_api import geocode_cache
    monkeypatch.setattr(geocode_cache, "geocode_address", lambda q: None)
    store_member_calendar_events([_no_coords(source_id="none")])
    with get_session() as session:
        row = session.query(EventTable).filter_by(source_id="none").one()
        assert row.location_latitude is None and row.location_longitude is None
        assert not row.extras.get("locationApprox")


def test_geocoder_exception_does_not_break_the_sync(monkeypatch):
    from v1.google_maps_api import geocode_cache

    def boom(q):
        raise RuntimeError("down")
    monkeypatch.setattr(geocode_cache, "geocode_address", boom)
    assert store_member_calendar_events([_no_coords(source_id="boom")]) == 1


def test_no_place_means_no_geocoding(monkeypatch):
    from v1.google_maps_api import geocode_cache
    calls = []
    monkeypatch.setattr(geocode_cache, "geocode_address", lambda q: calls.append(q))
    store_member_calendar_events([_no_coords(source_id="np", postal_code=None, city=None)])
    assert calls == []


def test_repeated_city_is_geocoded_once_across_runs(monkeypatch):
    """The sync runs every half hour. A place is bought once, not every time."""
    from v1.google_maps_api import geocode_cache
    calls = []
    monkeypatch.setattr(geocode_cache, "geocode_address", lambda q: calls.append(q) or _place(59.0, 15.0))
    store_member_calendar_events([
        _no_coords(source_id="r1", city="Örebro"),
        _no_coords(source_id="r2", city="örebro "),
        _no_coords(source_id="r3", city="Örebro"),
    ])
    assert len(calls) == 1
    store_member_calendar_events([_no_coords(source_id="r4", city="Örebro")])
    assert len(calls) == 1


# -- How precise an approximate location is -----------------------------------

def _place(lat=59.0, lng=15.0, radius=14200, precision="approximate"):
    from v1.google_maps_api.geolocation_api import GeocodedPlace
    return GeocodedPlace(lat, lng, radius, precision)


def test_an_approximate_location_says_how_big_the_guess_was(monkeypatch):
    from v1.google_maps_api import geocode_cache
    monkeypatch.setattr(geocode_cache, "geocode_address", lambda q: _place())
    store_member_calendar_events([_no_coords(source_id="r", city="Örebro")])
    with get_session() as session:
        row = session.query(EventTable).filter_by(source_id="r").one()
    assert row.extras["locationApprox"] is True
    assert row.extras["locationRadiusMeters"] == 14200
    assert row.extras["locationPrecision"] == "approximate"


def test_an_exact_location_carries_no_radius(monkeypatch):
    """The member site gave real coordinates, so there is nothing to guess."""
    from v1.google_maps_api import geocode_cache
    monkeypatch.setattr(geocode_cache, "geocode_address", lambda q: _place())
    store_member_calendar_events([_event(source_id="exact")])
    with get_session() as session:
        row = session.query(EventTable).filter_by(source_id="exact").one()
    assert row.extras["locationApprox"] is False
    assert "locationRadiusMeters" not in row.extras
    assert "locationPrecision" not in row.extras


def test_a_geocode_without_a_radius_sets_no_radius(monkeypatch):
    from v1.google_maps_api import geocode_cache
    monkeypatch.setattr(geocode_cache, "geocode_address",
                        lambda q: _place(radius=None, precision=None))
    store_member_calendar_events([_no_coords(source_id="nr", city="Örebro")])
    with get_session() as session:
        row = session.query(EventTable).filter_by(source_id="nr").one()
    assert row.extras["locationApprox"] is True
    assert "locationRadiusMeters" not in row.extras
