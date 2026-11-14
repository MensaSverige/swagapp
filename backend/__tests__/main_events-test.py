"""Tests for main events: the riksträff row, registration, child linkage and gating."""

import asyncio
import datetime

import pytest
from fastapi import HTTPException

import v1.events.events_service as svc
from v1.api import users as users_api
from v1.db.database import get_session
from v1.db.external_events import store_external_event_details
from v1.db.models.external_events import ExternalEventDetails, ExternalRoot
from v1.db.tables import EventTable, MainEventAttendeeTable
from v1.db.users import create_user, update_user
from v1.db.external_bookings import add_booking
from v1.events import main_events
from v1.events.events_mappers import map_external_event, map_user_event, map_event_to_user_event
from v1.events.events_model import Event, EventSource, event_id
from v1.jobs import refresh_events
from v1.user_events.user_events_db import create_user_event, get_safe_user_event
from v1.user_events.user_events_model import UserEvent
from v1.utilities import get_current_time_zone

TODAY = datetime.date.today()
FIRST = (TODAY + datetime.timedelta(days=10)).isoformat()
LAST = (TODAY + datetime.timedelta(days=12)).isoformat()
ROOT_ID = f"root{FIRST}"


def _root(**kw):
    base = dict(
        version=1, loginUrl="https://example.com/login", restUrl="https://example.com/api",
        siteUrl="https://example.com", dates=[FIRST, LAST], header1="Halvarstraff",
        header2="Boras", city="Boras", streetAddress="Storgatan 1",
        mapUrl="https://maps.example.com",
    )
    base.update(kw)
    return ExternalRoot(**base)


def _user(user_id):
    return {"userId": user_id, "isMember": True, "settings": {}}


def _activity(event_id_=500, hours=30):
    start = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=hours)
    return ExternalEventDetails(
        eventId=event_id_, eventDate=start, startTime=start.strftime("%H:%M"),
        endTime=(start + datetime.timedelta(hours=1)).strftime("%H:%M"),
        titel="Activity", description="An activity", speaker="Speaker", location="Loc",
        isFree=True, price=0, isLimited=False, stock=10, showBooked=False, booked=0,
        eventUrl="http://example.com/event",
    )


def _calendar_row(source_id="42", days=5):
    start = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=days)
    with get_session() as session:
        session.add(EventTable(
            source="calendar", source_id=source_id, name="Manadsmote",
            start=start, end=start + datetime.timedelta(hours=2), official=True,
        ))
        session.commit()
    return f"cal{source_id}"


def _user_event(owner=1, parent=None):
    start = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=40)
    return UserEvent(userId=owner, name="Meetup", start=start,
                     end=start + datetime.timedelta(hours=1), parentEvent=parent)


def _event_body(parent=None):
    start = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=40)
    return Event(id="", name="Meetup", official=False, start=start, parentEvent=parent)


@pytest.fixture
def gating(monkeypatch):
    def set_(value):
        monkeypatch.setattr(svc.env_constants, "MAIN_EVENT_GATING", value)
    set_(False)
    return set_


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    monkeypatch.setattr(svc, "get_booked_external_events", lambda uid: [])


# -- root -> events -------------------------------------------------------------

def test_root_is_stored_as_a_main_event_with_expected_fields():
    assert main_events.store_root_main_event(_root())
    [event] = main_events.get_main_events()
    assert event.id == ROOT_ID
    assert event.source == EventSource.external_root
    assert event.sourceId == FIRST
    assert event.name == "Halvarstraff"
    assert event.description == "Boras"
    assert event.locationDescription == "Boras"
    assert event.address == "Storgatan 1"
    assert event.official is True
    assert event.extras == {"siteUrl": "https://example.com", "mapUrl": "https://maps.example.com",
                            "loginUrl": "https://example.com/login"}
    tz = get_current_time_zone()
    first = datetime.date.fromisoformat(FIRST)
    last = datetime.date.fromisoformat(LAST)
    start = event.start.replace(tzinfo=datetime.timezone.utc).astimezone(tz) if event.start.tzinfo is None else event.start.astimezone(tz)
    end = event.end.replace(tzinfo=datetime.timezone.utc).astimezone(tz) if event.end.tzinfo is None else event.end.astimezone(tz)
    assert (start.date(), start.hour, start.minute) == (first, 0, 0)
    assert (end.date(), end.hour, end.minute) == (last, 23, 59)


def test_root_upsert_is_idempotent_and_updates_in_place():
    main_events.store_root_main_event(_root())
    main_events.store_root_main_event(_root(header1="Renamed"))
    with get_session() as session:
        rows = session.query(EventTable).filter_by(source="external_root").all()
    assert len(rows) == 1
    assert rows[0].name == "Renamed"


def test_unparseable_root_dates_are_skipped_not_raised():
    assert main_events.store_root_main_event(_root(dates=["soon"])) is False
    assert main_events.get_main_events() == []


def test_root_dates_with_a_time_part_are_accepted():
    assert main_events.store_root_main_event(_root(dates=[f"{FIRST}T00:00:00", LAST]))
    assert main_events.get_main_events()[0].id == f"root{FIRST}T00:00:00"


def test_refresh_stores_the_root_main_event(monkeypatch):
    monkeypatch.setattr(refresh_events, "get_external_root", lambda: _root())
    monkeypatch.setattr(refresh_events, "get_external_event_details", lambda url, date: [])
    monkeypatch.setattr(refresh_events, "refresh_external_bookings", lambda: None)
    refresh_events.refresh_external_events()
    assert [e.id for e in main_events.get_main_events()] == [ROOT_ID]


# -- child linkage ----------------------------------------------------------------

def test_external_activity_points_at_the_stored_root():
    main_events.store_root_main_event(_root())
    mapped = map_external_event(_activity(), 1, set())
    assert mapped.parentEvent == ROOT_ID


def test_external_activity_has_no_parent_without_a_stored_root():
    assert map_external_event(_activity(), 1, set()).parentEvent is None


def test_user_event_parent_round_trips():
    main_events.store_root_main_event(_root())
    ue = map_event_to_user_event(_event_body(parent=ROOT_ID), 1)
    assert ue.parentEvent == ROOT_ID
    created = get_safe_user_event(str(create_user_event(ue)))
    assert map_user_event(created, 1).parentEvent == ROOT_ID


# -- /events/main -------------------------------------------------------------------

def test_main_listing_has_attending_and_bookable():
    main_events.store_root_main_event(_root())
    cal = _calendar_row()
    events = svc.list_main_events(_user(1))
    assert [e.id for e in events] == [cal, ROOT_ID]  # sorted by start
    assert all(e.attending is False and e.bookable is True for e in events)

    svc.attend_event_via_unified(ROOT_ID, _user(1))
    by_id = {e.id: e for e in svc.list_main_events(_user(1))}
    assert by_id[ROOT_ID].attending is True and by_id[ROOT_ID].bookable is False
    assert by_id[cal].attending is False and by_id[cal].bookable is True


def test_main_listing_drops_ended_events_but_keeps_yesterdays():
    main_events.store_root_main_event(_root())
    old = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3)
    recent = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=10)
    with get_session() as session:
        session.add(EventTable(source="calendar", source_id="old", name="Old", start=old, official=True))
        session.add(EventTable(source="calendar", source_id="recent", name="Recent", start=recent, official=True))
        session.commit()
    ids = [e.id for e in svc.list_main_events(_user(1))]
    assert "calold" not in ids and "calrecent" in ids and ROOT_ID in ids


def test_main_route_is_registered_before_the_catch_all_paths():
    from v1.events.events_api import unified_events_v1
    get_paths = [r.path for r in unified_events_v1.routes if "GET" in r.methods]
    assert "/v1/events/main" in get_paths


# -- attend / unattend ---------------------------------------------------------------

def test_attend_main_event_is_idempotent_and_returns_the_event():
    cal = _calendar_row()
    first = svc.attend_event_via_unified(cal, _user(7))
    again = svc.attend_event_via_unified(cal, _user(7))
    assert first.id == again.id == cal
    assert first.attending is True and first.bookable is False
    with get_session() as session:
        assert session.query(MainEventAttendeeTable).filter_by(event_id=cal, user_id=7).count() == 1


def test_attend_unknown_main_event_is_404():
    for bad in ("cal999", "root2000-01-01"):
        with pytest.raises(HTTPException) as exc:
            svc.attend_event_via_unified(bad, _user(7))
        assert exc.value.status_code == 404
        with pytest.raises(HTTPException) as exc:
            svc.unattend_event_via_unified(bad, _user(7))
        assert exc.value.status_code == 404


def test_unattend_main_event_removes_the_registration():
    cal = _calendar_row()
    svc.attend_event_via_unified(cal, _user(7))
    svc.unattend_event_via_unified(cal, _user(7))
    assert main_events.is_registered(7, cal) is False
    svc.unattend_event_via_unified(cal, _user(7))  # nothing left to remove: still fine


# -- registration through the booking cache --------------------------------------------

def test_booking_cache_registers_the_user_for_the_root_only():
    main_events.store_root_main_event(_root())
    cal = _calendar_row()
    store_external_event_details([_activity(500)])
    add_booking(userId=8, eventId=500)
    assert main_events.is_registered(8, ROOT_ID) is True
    assert main_events.is_registered(8, cal) is False
    assert main_events.is_registered(9, ROOT_ID) is False


def test_booking_on_an_event_that_is_no_longer_stored_does_not_count():
    main_events.store_root_main_event(_root())
    add_booking(userId=8, eventId=12345)
    assert main_events.is_registered(8, ROOT_ID) is False


def test_unattend_keeps_a_booking_derived_registration():
    main_events.store_root_main_event(_root())
    store_external_event_details([_activity(500)])
    add_booking(userId=8, eventId=500)
    svc.attend_event_via_unified(ROOT_ID, _user(8))
    svc.unattend_event_via_unified(ROOT_ID, _user(8))
    assert main_events.is_registered(8, ROOT_ID) is True


# -- /events with gating off -----------------------------------------------------------------

def _seed_children():
    main_events.store_root_main_event(_root())
    store_external_event_details([_activity(500)])
    create_user_event(_user_event(owner=1, parent=ROOT_ID))
    create_user_event(_user_event(owner=1, parent=None))


def _ids(events):
    return {e.id for e in events}


def test_list_never_includes_main_events_and_gating_off_shows_all_children(gating):
    _seed_children()
    _calendar_row()
    ids = _ids(svc.list_unified_events(_user(2)))
    assert ids == {"ext500", "usr1", "usr2"}


def test_parent_param_returns_only_the_children_of_that_main_event(gating):
    _seed_children()
    ids = _ids(svc.list_unified_events(_user(2), parent=ROOT_ID))
    assert ids == {"ext500", "usr1"}
    assert svc.list_unified_events(_user(2), parent="cal1") == []


def test_attending_filter_still_works_for_children(gating):
    _seed_children()
    assert svc.list_unified_events(_user(2), attending=True) == []


# -- gating on ------------------------------------------------------------------------------------

def test_gating_hides_children_of_unregistered_main_events_but_keeps_legacy_ones(gating):
    _seed_children()
    gating(True)
    assert _ids(svc.list_unified_events(_user(2))) == {"usr2"}


def test_gating_shows_children_once_registered(gating):
    _seed_children()
    gating(True)
    svc.attend_event_via_unified(ROOT_ID, _user(2))
    assert _ids(svc.list_unified_events(_user(2))) == {"ext500", "usr1", "usr2"}


def test_gating_shows_children_to_users_registered_through_a_booking(gating):
    _seed_children()
    add_booking(userId=3, eventId=500)
    gating(True)
    assert "ext500" in _ids(svc.list_unified_events(_user(3)))


def test_gating_blocks_attending_a_child_of_an_unregistered_parent(gating, monkeypatch):
    _seed_children()
    gating(True)
    monkeypatch.setattr(svc, "book_external_event", lambda uid, eid: pytest.fail("must not book"))
    for child in ("ext500", "usr1"):
        with pytest.raises(HTTPException) as exc:
            svc.attend_event_via_unified(child, _user(2))
        assert exc.value.status_code == 403


def test_gating_off_allows_attending_a_child(gating):
    _seed_children()
    assert svc.attend_event_via_unified("usr1", _user(2)).attending is True


def test_gating_allows_attending_a_child_once_registered(gating):
    _seed_children()
    gating(True)
    svc.attend_event_via_unified(ROOT_ID, _user(2))
    assert svc.attend_event_via_unified("usr1", _user(2)).attending is True


# -- creating user events with a parent -----------------------------------------------------------------

def test_create_with_unknown_parent_is_400(gating):
    with pytest.raises(HTTPException) as exc:
        svc.create_user_event_via_unified(_event_body(parent="root2000-01-01"), _user(1))
    assert exc.value.status_code == 400


def test_create_with_a_parent_works_when_gating_is_off(gating):
    main_events.store_root_main_event(_root())
    created = svc.create_user_event_via_unified(_event_body(parent=ROOT_ID), _user(1))
    assert created.parentEvent == ROOT_ID


def test_create_with_a_parent_is_403_when_gated_and_unregistered(gating):
    main_events.store_root_main_event(_root())
    gating(True)
    with pytest.raises(HTTPException) as exc:
        svc.create_user_event_via_unified(_event_body(parent=ROOT_ID), _user(1))
    assert exc.value.status_code == 403
    svc.attend_event_via_unified(ROOT_ID, _user(1))
    assert svc.create_user_event_via_unified(_event_body(parent=ROOT_ID), _user(1)).parentEvent == ROOT_ID


def test_create_without_a_parent_is_unaffected_by_gating(gating):
    gating(True)
    assert svc.create_user_event_via_unified(_event_body(), _user(1)).parentEvent is None


def test_update_validates_a_changed_parent_and_keeps_an_omitted_one(gating):
    main_events.store_root_main_event(_root())
    created = svc.create_user_event_via_unified(_event_body(parent=ROOT_ID), _user(1))
    # A released app sends no parentEvent: the link survives the edit.
    kept = svc.update_user_event_via_unified(created.id, _event_body(parent=None), _user(1))
    assert kept.parentEvent == ROOT_ID
    with pytest.raises(HTTPException) as exc:
        svc.update_user_event_via_unified(created.id, _event_body(parent="cal404"), _user(1))
    assert exc.value.status_code == 400


# -- GET /users?event_id ------------------------------------------------------------------------------------

def _visible_user(member_id):
    create_user({"memberId": member_id, "type": "M", "firstName": "U", "lastName": str(member_id),
                 "email": f"{member_id}@test.com"})
    update_user(member_id, {"settings": {"show_location": "EVERYONE", "show_profile": "EVERYONE"}})


def _get_users(viewer, **kw):
    return asyncio.run(users_api.get_users(show_location=True, current_user=viewer, **kw))


def test_users_without_event_id_are_unchanged():
    for uid in (100, 200):
        _visible_user(uid)
    assert {u["userId"] for u in _get_users(_user(100))} == {100, 200}


def test_users_event_id_filters_to_registered_users():
    for uid in (100, 200, 300):
        _visible_user(uid)
    cal = _calendar_row()
    svc.attend_event_via_unified(cal, _user(100))
    svc.attend_event_via_unified(cal, _user(200))
    assert {u["userId"] for u in _get_users(_user(100), event_id=cal)} == {100, 200}


def test_users_event_id_includes_booking_derived_registrations():
    for uid in (100, 200):
        _visible_user(uid)
    main_events.store_root_main_event(_root())
    store_external_event_details([_activity(500)])
    add_booking(userId=100, eventId=500)
    add_booking(userId=200, eventId=500)
    assert {u["userId"] for u in _get_users(_user(100), event_id=ROOT_ID)} == {100, 200}


def test_users_event_id_is_403_for_an_unregistered_viewer():
    _visible_user(100)
    cal = _calendar_row()
    with pytest.raises(HTTPException) as exc:
        _get_users(_user(100), event_id=cal)
    assert exc.value.status_code == 403


def test_users_event_id_is_404_for_an_unknown_event():
    _visible_user(100)
    with pytest.raises(HTTPException) as exc:
        _get_users(_user(100), event_id="cal404")
    assert exc.value.status_code == 404


# -- id lookups ---------------------------------------------------------------------------------------

def test_main_event_lookup_with_an_unknown_prefix_finds_nothing():
    _calendar_row()
    for bad in ("zzz42", "cal", "", "ext500", "usr1"):
        assert main_events.get_main_event(bad) is None
        assert main_events.is_main_event(bad) is False
    with pytest.raises(HTTPException) as exc:
        svc.attend_event_via_unified("zzz42", _user(1))
    assert exc.value.status_code == 400
    assert main_events.is_main_event("cal42") is True


def test_main_listing_excludes_long_past_calendar_rows_in_sql():
    long_ago = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=400)
    with get_session() as session:
        session.add(EventTable(source="calendar", source_id="ancient", name="Ancient", start=long_ago, official=True))
        session.add(EventTable(source="calendar", source_id="ancient2", name="Ancient2", start=long_ago,
                               end=long_ago + datetime.timedelta(hours=2), official=True))
        session.commit()
    cal = _calendar_row("fresh")
    assert [e.id for e in svc.list_main_events(_user(1))] == [cal]
