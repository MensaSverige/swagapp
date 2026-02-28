from datetime import datetime, timedelta
from typing import List
from sqlalchemy import or_, and_
from v1.user_events.user_events_model import ExtendedUserEvent, UserEvent
from v1.db.database import get_session
from v1.db.tables import (
    UserEventTable, EventHostTable, EventSuggestedHostTable,
    EventAttendeeTable, EventReportTable, UserTable,
)
from v1.utilities import get_current_time


def create_user_event(user_event) -> int:
    """
    Create a new user event.

    :param user_event: User event Pydantic model.
    :return: The created user event ID.
    """
    data = user_event.model_dump()
    with get_session() as session:
        row = UserEventTable(
            userId=data["userId"],
            name=data["name"],
            start=data["start"],
            end=data.get("end"),
            description=data.get("description"),
            maxAttendees=data.get("maxAttendees"),
        )
        # Location
        loc = data.get("location")
        if loc:
            row.location_description = loc.get("description")
            row.location_address = loc.get("address")
            row.location_marker = loc.get("marker")
            row.location_latitude = loc.get("latitude")
            row.location_longitude = loc.get("longitude")

        session.add(row)
        session.flush()  # get the id

        # Hosts
        for h in data.get("hosts") or []:
            session.add(EventHostTable(event_id=row.id, userId=h["userId"]))
        for h in data.get("suggested_hosts") or []:
            session.add(EventSuggestedHostTable(event_id=row.id, userId=h["userId"]))
        for a in data.get("attendees") or []:
            session.add(EventAttendeeTable(event_id=row.id, userId=a["userId"]))
        for r in data.get("reports") or []:
            session.add(EventReportTable(event_id=row.id, userId=r["userId"], text=r["text"]))

        session.commit()
        return row.id


def _load_event(session, event_id: int) -> UserEventTable | None:
    """Load a user event with all relationships."""
    return session.query(UserEventTable).filter_by(id=int(event_id)).first()


def get_unsafe_user_event(event_id: str) -> UserEvent | None:
    """
    Retrieves a user event from the database.
    This function should only be used for internal operations, as it returns secret fields.
    """
    try:
        with get_session() as session:
            row = _load_event(session, event_id)
            return UserEvent(**row.to_dict()) if row else None
    except Exception:
        return None


def get_safe_user_event(event_id: str) -> ExtendedUserEvent | None:
    """
    Retrieves a user event from the database, without secret fields.
    """
    event = get_unsafe_user_event(event_id)
    if not event:
        return None
    return extend_user_event(make_user_event_safe(event))


def update_user_event(event_id: str, user_event: UserEvent) -> bool:
    """
    Updates a user event in the database.
    """
    # Restore secret fields from DB before updating
    event = restore_secret_fields_on_user_event(user_event, event_id)
    if not event:
        return False

    data = event.model_dump()
    with get_session() as session:
        row = _load_event(session, event_id)
        if not row:
            return False

        row.userId = data["userId"]
        row.name = data["name"]
        row.start = data["start"]
        row.end = data.get("end")
        row.description = data.get("description")
        row.maxAttendees = data.get("maxAttendees")

        loc = data.get("location")
        if loc:
            row.location_description = loc.get("description")
            row.location_address = loc.get("address")
            row.location_marker = loc.get("marker")
            row.location_latitude = loc.get("latitude")
            row.location_longitude = loc.get("longitude")
        else:
            row.location_description = None
            row.location_address = None
            row.location_marker = None
            row.location_latitude = None
            row.location_longitude = None

        # Replace child rows
        row.hosts.clear()
        for h in data.get("hosts") or []:
            row.hosts.append(EventHostTable(event_id=row.id, userId=h["userId"]))

        row.suggested_hosts.clear()
        for h in data.get("suggested_hosts") or []:
            row.suggested_hosts.append(EventSuggestedHostTable(event_id=row.id, userId=h["userId"]))

        row.attendees.clear()
        for a in data.get("attendees") or []:
            row.attendees.append(EventAttendeeTable(event_id=row.id, userId=a["userId"]))

        row.reports.clear()
        for r in data.get("reports") or []:
            row.reports.append(EventReportTable(event_id=row.id, userId=r["userId"], text=r["text"]))

        session.commit()
        return True


def delete_user_event(event_id: str) -> bool:
    """Deletes a user event from the database."""
    with get_session() as session:
        row = _load_event(session, event_id)
        if not row:
            return False
        session.delete(row)
        session.commit()
        return True


def get_unsafe_future_user_events() -> list[UserEvent]:
    """Retrieves all future user events."""
    current_time = get_current_time().replace(tzinfo=None)
    with get_session() as session:
        rows = session.query(UserEventTable).filter(
            or_(
                UserEventTable.end >= current_time,
                and_(
                    UserEventTable.start >= current_time - timedelta(hours=1),
                    UserEventTable.end.is_(None),
                ),
            )
        ).all()
        return [UserEvent(**row.to_dict()) for row in rows]


def get_safe_future_user_events() -> list[ExtendedUserEvent]:
    """Retrieves all future user events, without secret fields."""
    return extend_user_events(
        remove_secrets_from_user_events(get_unsafe_future_user_events()))


def get_safe_user_events_since(since: datetime) -> list[ExtendedUserEvent]:
    """Retrieves all user events with start >= `since`."""
    with get_session() as session:
        rows = session.query(UserEventTable).filter(
            UserEventTable.start >= since
        ).all()
        events = [UserEvent(**row.to_dict()) for row in rows]
    return extend_user_events(remove_secrets_from_user_events(events))


def get_unsafe_user_events_user_owns(userId: int) -> list[UserEvent]:
    """Retrieves all user events that a user owns."""
    with get_session() as session:
        rows = session.query(UserEventTable).filter_by(userId=userId).all()
        return [UserEvent(**row.to_dict()) for row in rows]


def get_safe_user_events_user_owns(userId: int) -> list[ExtendedUserEvent]:
    """Retrieves all user events that a user owns."""
    return extend_user_events(
        remove_secrets_from_user_events(
            get_unsafe_user_events_user_owns(userId)))


def get_unsafe_user_events_user_is_hosting(userId: int) -> list[UserEvent]:
    """Retrieves all user events that a user is hosting."""
    with get_session() as session:
        rows = session.query(UserEventTable).join(EventHostTable).filter(
            EventHostTable.userId == userId
        ).all()
        return [UserEvent(**row.to_dict()) for row in rows]


def get_safe_user_events_user_is_hosting(userId: int) -> list[ExtendedUserEvent]:
    """Retrieves all user events that a user is hosting."""
    return extend_user_events(
        remove_secrets_from_user_events(
            get_unsafe_user_events_user_is_hosting(userId)))


def get_unsafe_user_events_user_is_attending(userId: int) -> list[UserEvent]:
    """Retrieves all user events that a user is attending."""
    with get_session() as session:
        rows = session.query(UserEventTable).join(EventAttendeeTable).filter(
            EventAttendeeTable.userId == userId
        ).all()
        return [UserEvent(**row.to_dict()) for row in rows]


def get_safe_user_events_user_is_attending(userId: int) -> list[ExtendedUserEvent]:
    """Retrieves all user events that a user is attending."""
    return extend_user_events(
        remove_secrets_from_user_events(
            get_unsafe_user_events_user_is_attending(userId)))


def add_attendee_to_user_event(event_id: str, user_id: int) -> bool:
    """Adds a user to the attendees list of an event, ensuring no duplicates."""
    try:
        with get_session() as session:
            row = _load_event(session, event_id)
            if not row:
                return False
            if row.maxAttendees is not None and len(row.attendees) >= row.maxAttendees:
                return False
            # Check for duplicate
            if any(a.userId == user_id for a in row.attendees):
                return True
            session.add(EventAttendeeTable(event_id=row.id, userId=user_id))
            session.commit()
            return True
    except Exception:
        return False


def remove_attendee_from_user_event(event_id: str, user_id: int) -> bool:
    """Removes a user from the attendees list of an event."""
    with get_session() as session:
        row = _load_event(session, event_id)
        if not row:
            return False
        attendee = next((a for a in row.attendees if a.userId == user_id), None)
        if attendee:
            session.delete(attendee)
            session.commit()
            return True
        return False


### Hosts and host invites ###


def get_unsafe_user_events_user_is_invited_to_host(userId: int) -> list[UserEvent]:
    """Retrieves all user events that a user is suggested to co-host."""
    with get_session() as session:
        rows = session.query(UserEventTable).join(EventSuggestedHostTable).filter(
            EventSuggestedHostTable.userId == userId
        ).all()
        return [UserEvent(**row.to_dict()) for row in rows]


def get_safe_user_events_user_is_invited_to_host(userId: int) -> list[ExtendedUserEvent]:
    """Retrieves all user events that a user is suggested to co-host."""
    return extend_user_events(
        remove_secrets_from_user_events(
            get_unsafe_user_events_user_is_invited_to_host(userId)))


def add_user_as_host_to_user_event(event_id: str, user_id: int) -> bool:
    """Adds a user to the hosts list and removes from suggested_hosts."""
    with get_session() as session:
        row = _load_event(session, event_id)
        if not row:
            return False
        # Add to hosts if not already there
        if not any(h.userId == user_id for h in row.hosts):
            session.add(EventHostTable(event_id=row.id, userId=user_id))
        # Remove from suggested_hosts
        suggested = next((s for s in row.suggested_hosts if s.userId == user_id), None)
        if suggested:
            session.delete(suggested)
        session.commit()
        return True


def remove_user_from_hosts_of_user_event(event_id: str, user_id: int) -> bool:
    """Removes a user from the hosts list of an event."""
    with get_session() as session:
        row = _load_event(session, event_id)
        if not row:
            return False
        host = next((h for h in row.hosts if h.userId == user_id), None)
        if host:
            session.delete(host)
            session.commit()
            return True
        return False


def remove_user_host_invitation_from_user_event(event_id: str, user_id: int) -> bool:
    """Removes a user from the suggested hosts list of an event."""
    with get_session() as session:
        row = _load_event(session, event_id)
        if not row:
            return False
        suggested = next((s for s in row.suggested_hosts if s.userId == user_id), None)
        if suggested:
            session.delete(suggested)
            session.commit()
            return True
        return False


### Reports ###


def add_or_update_report_on_user_event(event_id: str, user_id: int, report: str) -> bool:
    """Adds a report to an event, or updates an existing report."""
    with get_session() as session:
        row = _load_event(session, event_id)
        if not row:
            return False
        existing = next((r for r in row.reports if r.userId == user_id), None)
        if existing:
            existing.text = report
        else:
            session.add(EventReportTable(event_id=row.id, userId=user_id, text=report))
        session.commit()
        return True


def remove_report_from_user_event(event_id: str, user_id: int) -> bool:
    """Removes a report from an event."""
    with get_session() as session:
        row = _load_event(session, event_id)
        if not row:
            return False
        existing = next((r for r in row.reports if r.userId == user_id), None)
        if existing:
            session.delete(existing)
            session.commit()
            return True
        return False


### Utilities ###


def extend_user_event(event: UserEvent) -> ExtendedUserEvent:
    return extend_user_events([event])[0]


def extend_user_events(events: List[UserEvent]) -> List[ExtendedUserEvent]:
    # Fetch user IDs
    user_ids = set()
    for event in events:
        user_ids.add(event.userId)
        user_ids.update(host.userId for host in event.hosts)
        user_ids.update(attendee.userId for attendee in event.attendees)

    user_ids = list(user_ids)

    # Fetch user names
    user_names = {}
    with get_session() as session:
        users = session.query(UserTable).filter(UserTable.userId.in_(user_ids)).all()
        for user in users:
            user_names[user.userId] = f"{user.firstName} {user.lastName}"

    def _extend(event_dict: dict, user_names: dict[int, str]) -> ExtendedUserEvent:
        event_dict["ownerName"] = user_names.get(event_dict["userId"], "Unknown")
        event_dict["hostNames"] = [
            user_names.get(host["userId"], "Unknown") for host in event_dict["hosts"]
        ]
        event_dict["attendeeNames"] = [
            user_names.get(attendee["userId"], "Unknown") for attendee in event_dict["attendees"]
        ]
        return ExtendedUserEvent(**event_dict)

    event_dicts = [event.model_dump() for event in events]
    return [_extend(event_dict, user_names) for event_dict in event_dicts]


def make_user_event_safe(event: UserEvent) -> UserEvent:
    """Set secret fields to their model default values."""
    event.reports = []
    return event


def remove_secrets_from_user_events(events: list[UserEvent]) -> list[UserEvent]:
    """Set secret fields to their model default values in a list of user events."""
    return [make_user_event_safe(event) for event in events]


def restore_secret_fields_on_user_event(event: UserEvent, event_id: str = None) -> UserEvent | None:
    """Restore secret fields to their original values."""
    lookup_id = event_id or event.id
    if not lookup_id:
        return None

    original_event = get_unsafe_user_event(lookup_id)
    if not original_event:
        return None

    event.reports = original_event.reports
    return event
