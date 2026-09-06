"""
Timezone regression tests for the event mappers.

Background: the Postgres migration (#301) made every DateTime column
timezone=True, so the DB now hands the mappers timezone-aware datetimes.
MongoDB returned naive ones. The mappers still built `now` naively and
compared the two, which raised

    TypeError: can't compare offset-naive and offset-aware datetimes

on every user-event create and on every event list. The existing mapper
tests all construct naive datetimes (datetime.now(), datetime.utcnow()),
so none of them exercised the path the database actually takes.

These tests pin the aware path specifically.
"""
import datetime

from v1.events.events_mappers import _as_aware, map_external_event, map_user_event
from v1.db.models.external_events import ExternalEventDetails
from v1.user_events.user_events_model import ExtendedUserEvent, Host, Location
from v1.utilities import get_current_time_zone


class DummyExtendedUserEvent(ExtendedUserEvent):
    pass


def _user_event(start, end=None, owner_id=42):
    """A user event whose start/end are passed through verbatim (datetime in,
    datetime out — the model's validator only rewrites *strings*)."""
    return DummyExtendedUserEvent(
        _id="1",
        userId=owner_id,
        hosts=[Host(userId=owner_id)],
        suggested_hosts=[],
        name="Tidszonsevent",
        location=Location(description="Desc", address="Addr"),
        start=start,
        end=end if end is not None else start + datetime.timedelta(hours=1),
        description="x",
        reports=[],
        attendees=[],
        maxAttendees=None,
        ownerName="Owner",
        hostNames=["Owner"],
        attendeeNames=[],
    )


def _external_event(event_date, event_id=100):
    return ExternalEventDetails(
        eventId=event_id,
        eventDate=event_date,
        startTime=event_date.strftime("%H:%M"),
        endTime=(event_date + datetime.timedelta(hours=1)).strftime("%H:%M"),
        titel="External Event",
        description="An external event",
        speaker="Speaker",
        location="Loc",
        isFree=True,
        price=0,
        isLimited=False,
        stock=10,
        showBooked=True,
        booked=0,
        admins=["20210357"],
        eventUrl="http://example.com/event",
    )


# ── _as_aware ────────────────────────────────────────────────────────────────

def test_as_aware_leaves_aware_datetimes_untouched():
    aware = datetime.datetime(2026, 12, 1, 18, 0, tzinfo=datetime.timezone.utc)
    assert _as_aware(aware) is aware


def test_as_aware_passes_none_through():
    assert _as_aware(None) is None


def test_as_aware_localizes_naive_without_lmt_drift():
    """pytz zones carry a Local Mean Time offset (+1:12 for Stockholm).

    Using ``replace(tzinfo=...)`` instead of ``localize()`` would apply that
    LMT offset verbatim and silently shift every naive datetime by 12 minutes.
    """
    naive_summer = datetime.datetime(2026, 7, 1, 12, 0)
    localized = _as_aware(naive_summer)

    assert localized.tzinfo is not None
    # CEST — a whole number of hours, not 1:12.
    assert localized.utcoffset() == datetime.timedelta(hours=2)
    # The wall-clock reading must not move.
    assert localized.replace(tzinfo=None) == naive_summer


def test_as_aware_handles_winter_offset():
    localized = _as_aware(datetime.datetime(2026, 1, 15, 12, 0))
    assert localized.utcoffset() == datetime.timedelta(hours=1)  # CET


# ── map_user_event ───────────────────────────────────────────────────────────

def test_map_user_event_accepts_aware_start_from_database():
    """The #301 regression: aware start vs naive now raised TypeError."""
    start = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=2)
    event = map_user_event(_user_event(start), current_user_id=42)

    assert event.name == "Tidszonsevent"
    assert event.bookable is True  # future, uncapped, not attending


def test_map_user_event_still_accepts_naive_start():
    """Legacy naive values are read as Swedish wall-clock, not as UTC.

    ``datetime.now()`` is deliberately avoided: it returns the *machine's*
    local time, which is UTC in CI and Stockholm on a developer laptop. That
    ambiguity is what made the old suite pass or fail by a few microseconds.
    """
    from v1.utilities import get_current_time
    naive_local = get_current_time().replace(tzinfo=None) + datetime.timedelta(hours=48)
    event = map_user_event(_user_event(naive_local), current_user_id=42)

    assert event.bookable is True
    assert event.start.tzinfo is not None


def test_map_user_event_always_emits_aware_datetimes():
    """Event.start feeds a cross-type sort, so it must never be naive."""
    naive = datetime.datetime.now() + datetime.timedelta(hours=2)
    event = map_user_event(_user_event(naive), current_user_id=42)

    assert event.start.tzinfo is not None
    assert event.end.tzinfo is not None
    assert event.bookingEnd.tzinfo is not None


def test_map_user_event_past_event_is_not_bookable():
    """The comparison must still be meaningful, not merely non-throwing."""
    past = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=5)
    event = map_user_event(_user_event(past), current_user_id=42)

    assert event.bookable is False


# ── map_external_event ───────────────────────────────────────────────────────

def test_map_external_event_accepts_aware_event_date():
    """eventDate is a timestamptz column, so it comes back aware."""
    start = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=3)
    event = map_external_event(_external_event(start), current_user_id=1, booked_ids=set())

    assert event is not None
    assert event.start.tzinfo is not None


def test_map_external_event_still_accepts_naive_event_date():
    start = datetime.datetime.utcnow() + datetime.timedelta(hours=3)
    event = map_external_event(_external_event(start), current_user_id=1, booked_ids=set())

    assert event is not None
    assert event.start.tzinfo is not None


# ── the cross-type sort in events_service.list_unified_events ────────────────

def test_external_and_user_events_sort_together():
    """list_unified_events sorts both kinds by (start, name) in one list.

    A naive start from one mapper and an aware start from the other makes that
    sort raise, so this pins the invariant that both are aware.
    """
    aware_start = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=4)
    naive_start = datetime.datetime.now() + datetime.timedelta(hours=2)

    user_event = map_user_event(_user_event(aware_start), current_user_id=42)
    external_event = map_external_event(
        _external_event(naive_start), current_user_id=1, booked_ids=set()
    )

    merged = [user_event, external_event]
    merged.sort(key=lambda e: (e.start, e.name.lower()))  # must not raise

    assert len(merged) == 2
