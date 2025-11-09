import datetime
from v1.events.events_mappers import map_external_event, map_user_event
from v1.events.events_service import list_unified_events
from v1.db.models.external_events import ExternalEventDetails, Category
from v1.user_events.user_events_model import ExtendedUserEvent, UserEvent, Attendee, Host, Location

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

