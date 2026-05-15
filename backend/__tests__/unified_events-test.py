import datetime
from v1.events.events_mappers import map_external_event, map_user_event
from v1.events.events_service import list_unified_events
from v1.db.models.external_events import ExternalEventDetails, Category
from v1.user_events.user_events_model import ExtendedUserEvent, UserEvent, Attendee, Host, Location
from v1.events.events_model import Event, EventAttendee

class DummyExtendedUserEvent(ExtendedUserEvent):
    pass


def make_user_event(event_id: str, owner_id: int, start_offset_hours: int = 2, attendees=None, max_attendees=None):
    start = datetime.datetime.utcnow() + datetime.timedelta(hours=start_offset_hours)
    ue = DummyExtendedUserEvent(
        _id=event_id,
        userId=owner_id,
        hosts=[Host(userId=owner_id)],
        suggested_hosts=[],
        name="User Event",
        location=Location(description="Desc", address="Addr"),
        start=start,
        end=start + datetime.timedelta(hours=1),
        description="A user event",
        reports=[],
        attendees=attendees or [],
        maxAttendees=max_attendees,
        ownerName="Owner Name",
        hostNames=["Owner Name"],
        attendeeNames=["Someone"],
    )
    return ue


def make_external_event(event_id: int, start_offset_hours: int = 3, is_limited=False, stock=10, booked=0):
    start_dt = datetime.datetime.utcnow() + datetime.timedelta(hours=start_offset_hours)
    e = ExternalEventDetails(
        eventId=event_id,
        eventDate=start_dt,
        startTime=start_dt.strftime("%H:%M"),
        endTime=(start_dt + datetime.timedelta(hours=1)).strftime("%H:%M"),
        titel="External Event",
        description="An external event",
        speaker="Speaker",
        location="Loc",
        isFree=True,
        price=0,
        isLimited=is_limited,
        stock=stock,
        showBooked=True,
        booked=booked,
        admins=["20210357"],
        eventUrl="http://example.com/event",
    )
    return e


def test_map_external_event_attending_and_bookable():
    ext = make_external_event(100)
    mapped_attending = map_external_event(ext, current_user_id=1, booked_ids={100})
    assert mapped_attending.attending is True
    assert mapped_attending.bookable is False  # already attending

    mapped_not_attending = map_external_event(ext, current_user_id=1, booked_ids=set())
    assert mapped_not_attending.attending is False
    assert mapped_not_attending.bookable is True


def test_external_admins_are_mapped_to_admin_ids():
    ext = make_external_event(101)
    mapped = map_external_event(ext, current_user_id=1, booked_ids=set())
    assert mapped.admin == [20210357]


def test_map_user_event_capacity():
    ue = make_user_event("507f1", owner_id=2, attendees=[Attendee(userId=3)], max_attendees=1)
    mapped = map_user_event(ue, current_user_id=4)
    assert mapped.bookable is False  # capacity full

    ue2 = make_user_event("507f2", owner_id=2, attendees=[], max_attendees=1)
    mapped2 = map_user_event(ue2, current_user_id=4)
    assert mapped2.bookable is True


def test_map_user_event_attending_flag():
    ue = make_user_event("507f3", owner_id=2, attendees=[Attendee(userId=5)])
    mapped = map_user_event(ue, current_user_id=5)
    assert mapped.attending is True


def test_filter_event_attendees_also_filters_attendee_names(monkeypatch):
    import v1.events.events_service as svc

    def fake_get_users_by_ids(ids):
        return [
            {"userId": 10, "settings": {"show_attendance": "NO_ONE"}},
            {"userId": 11, "settings": {"show_attendance": "MEMBERS_ONLY"}},
        ]
    monkeypatch.setattr(svc, "get_users_by_ids", fake_get_users_by_ids)

    event = Event(
        id="usr123",
        name="Test",
        official=False,
        start=datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        attendees=[EventAttendee(userId=10), EventAttendee(userId=11)],
        extras={"attendeeNames": ["Hidden User", "Visible User"]},
    )
    viewer = {"userId": 99, "isMember": True, "settings": {"show_attendance": "MEMBERS_ONLY"}}

    result = svc._filter_event_attendees(event, viewer)

    assert [a.userId for a in result.attendees] == [11]
    assert result.extras["attendeeNames"] == ["Visible User"]


# ── ExternalBookings CRUD tests ─────────────────────────────────────────────

def test_get_bookings_by_event_ids_groups_correctly(monkeypatch):
    """get_bookings_by_event_ids groups results by eventId."""
    from v1.db import external_bookings as eb

    class FakeCol:
        def find(self, query):
            return [
                {"userId": 1, "eventId": 10},
                {"userId": 2, "eventId": 10},
                {"userId": 3, "eventId": 20},
            ]

    monkeypatch.setattr(eb, "external_event_bookings_collection", FakeCol())

    result = eb.get_bookings_by_event_ids([10, 20])
    assert set(result[10]) == {1, 2}
    assert set(result[20]) == {3}


def test_get_bookings_by_event_ids_empty_returns_empty(monkeypatch):
    from v1.db import external_bookings as eb
    # When called with empty list, return empty dict without hitting DB
    result = eb.get_bookings_by_event_ids([])
    assert result == {}


def test_delete_user_bookings(monkeypatch):
    from v1.db import external_bookings as eb

    deleted_filter = []

    class FakeCol:
        def delete_many(self, f):
            deleted_filter.append(f)

    monkeypatch.setattr(eb, "external_event_bookings_collection", FakeCol())
    eb.delete_user_bookings(userId=5)
    assert deleted_filter == [{"userId": 5}]


def test_delete_booking(monkeypatch):
    from v1.db import external_bookings as eb

    deleted = []

    class FakeCol:
        def delete_one(self, f):
            deleted.append(f)

    monkeypatch.setattr(eb, "external_event_bookings_collection", FakeCol())
    eb.delete_booking(userId=5, eventId=99)
    assert deleted == [{"userId": 5, "eventId": 99}]

