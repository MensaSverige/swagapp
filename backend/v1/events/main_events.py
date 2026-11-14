"""Main events (the riksträff and member calendar events) and who is registered.

A main event is a row in the unified `events` table. Other events (external
activities, user events) can point at one through `parentEvent`. Registration
(anmälan) to a main event is stored in `main_event_attendees`, except that for
the riksträff anyone who has booked an activity on the booking site counts as
registered too, so people who booked before registration existed are not
locked out.
"""
from __future__ import annotations

import logging
from datetime import datetime, time, timedelta, timezone
from typing import List, Optional, Set, Tuple

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from v1.db.database import get_session
from v1.db.models.external_events import ExternalRoot
from v1.db.tables import (
    EventTable, ExternalEventBookingTable, ExternalEventDetailsTable,
    MainEventAttendeeTable,
)
from v1.events.events_model import Event, EventSource, _ID_PREFIX, event_id
from v1.member_calendar.calendar_db import _utc
from v1.utilities import ensure_aware, get_current_time

logger = logging.getLogger(__name__)

ROOT_SOURCE = EventSource.external_root.value


def _parse_date(value: str) -> Optional[datetime]:
    """A date string from the root's `dates`, as a naive midnight datetime."""
    value = (value or "").strip()
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d")
    except ValueError:
        pass
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return datetime.combine(parsed.date(), time.min)
    except ValueError:
        return None


def store_root_main_event(root: ExternalRoot) -> bool:
    """Upsert the riksträff as a main event on (source, source_id).

    Returns True if a row was written. Dates that cannot be parsed are skipped
    with an error log rather than raised: a bad root must not abort the refresh
    of the activities.
    """
    if not root.dates:
        return False
    first, last = _parse_date(root.dates[0]), _parse_date(root.dates[-1])
    if first is None or last is None:
        logger.error(f"Cannot parse external root dates {root.dates!r}; riksträff not stored")
        return False

    values = {
        "source": ROOT_SOURCE,
        "source_id": root.dates[0],
        "name": root.header1,
        "description": root.header2,
        "location_description": root.city,
        "location_address": root.streetAddress,
        "start": _utc(first),
        "end": _utc(datetime.combine(last.date(), time(23, 59))),
        "official": True,
        "extras": {"siteUrl": root.siteUrl, "mapUrl": root.mapUrl, "loginUrl": root.loginUrl},
    }
    try:
        with get_session() as session:
            existing = session.query(EventTable).filter_by(
                source=ROOT_SOURCE, source_id=values["source_id"]
            ).first()
            if existing:
                for field, value in values.items():
                    setattr(existing, field, value)
            else:
                session.add(EventTable(**values))
            session.commit()
        return True
    except Exception as e:
        logger.error(f"Failed to store riksträff main event: {e}")
        return False


def _utc_aware(dt: Optional[datetime]) -> Optional[datetime]:
    """SQLite hands back naive UTC; PostgreSQL hands back aware values."""
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def _sort_key(e: Event):
    return (_utc_aware(e.start), e.name.lower())


def get_main_events() -> List[Event]:
    """Every main event, sorted by start, with no viewer-specific fields set."""
    with get_session() as session:
        events = [Event(**row.to_dict()) for row in session.query(EventTable).all()]
    return sorted(events, key=_sort_key)


def get_open_main_events(now: Optional[datetime] = None) -> List[Event]:
    """Main events that have not ended more than a day ago, sorted by start.

    The member calendar keeps every approved event with no date limit, so the
    cut-off is applied in SQL and only the surviving rows become Events.
    """
    now = now or ensure_aware(get_current_time())
    cutoff = now.astimezone(timezone.utc) - timedelta(days=1)
    with get_session() as session:
        rows = session.query(EventTable).filter(
            func.coalesce(EventTable.end, EventTable.start) >= cutoff
        ).all()
        events = [Event(**row.to_dict()) for row in rows]
    return sorted(events, key=_sort_key)


def _split_id(unified_id: str) -> Optional[Tuple[str, str]]:
    """(source, source_id) for a unified id, or None for an unknown prefix."""
    for source, prefix in _ID_PREFIX.items():
        if unified_id.startswith(prefix) and len(unified_id) > len(prefix):
            return source.value, unified_id[len(prefix):]
    return None


def get_main_event(unified_id: str) -> Optional[Event]:
    parts = _split_id(unified_id)
    if parts is None:
        return None
    with get_session() as session:
        row = session.query(EventTable).filter_by(source=parts[0], source_id=parts[1]).first()
        return Event(**row.to_dict()) if row else None


def is_member_only(unified_id: Optional[str]) -> bool:
    """Whether a main event id belongs to the member calendar.

    The member calendar is internal to Mensa: its events, and anything that
    hangs off them, are for members only. Companions (medföljande -- people
    with an account for a riksträff who are not members) see the riksträff
    alone.
    """
    return bool(unified_id) and unified_id.startswith(_ID_PREFIX[EventSource.calendar])


def viewer_can_see(unified_id: Optional[str], current_user: Optional[dict]) -> bool:
    """False for a member calendar event and a viewer who is not a member."""
    if not is_member_only(unified_id):
        return True
    return bool(current_user and current_user.get("isMember"))


def get_visible_main_event(unified_id: str, current_user: Optional[dict]) -> Optional[Event]:
    """`get_main_event`, but None for one the viewer may not see -- to them it does not exist."""
    if not viewer_can_see(unified_id, current_user):
        return None
    return get_main_event(unified_id)


def is_main_event(unified_id: str) -> bool:
    parts = _split_id(unified_id)
    if parts is None:
        return False
    with get_session() as session:
        return session.query(EventTable.id).filter_by(
            source=parts[0], source_id=parts[1]
        ).first() is not None


def get_external_root_event_id() -> Optional[str]:
    """Unified id of the current riksträff main event, if one is stored.

    Older riksträffar stay in the table after the dates change; the latest
    start is the current one.
    """
    try:
        with get_session() as session:
            row = (
                session.query(EventTable)
                .filter_by(source=ROOT_SOURCE)
                .order_by(EventTable.start.desc(), EventTable.id.desc())
                .first()
            )
            return event_id(row.source, row.source_id) if row else None
    except Exception as e:
        logger.error(f"Failed to look up the riksträff main event: {e}")
        return None


def _booked_stored_events_query(session):
    """Cached bookings on external events that are still stored."""
    return session.query(ExternalEventBookingTable.userId).join(
        ExternalEventDetailsTable,
        ExternalEventDetailsTable.eventId == ExternalEventBookingTable.eventId,
    )


def get_registered_user_ids(main_event_id: str) -> Set[int]:
    with get_session() as session:
        users = {
            r.user_id for r in
            session.query(MainEventAttendeeTable.user_id).filter_by(event_id=main_event_id).all()
        }
        if main_event_id == get_external_root_event_id():
            users |= {r.userId for r in _booked_stored_events_query(session).distinct().all()}
    return users


def get_registered_event_ids(user_id: int) -> Set[str]:
    """Ids of the main events this user is registered to."""
    with get_session() as session:
        ids = {
            r.event_id for r in
            session.query(MainEventAttendeeTable.event_id).filter_by(user_id=user_id).all()
        }
        has_booking = _booked_stored_events_query(session).filter(
            ExternalEventBookingTable.userId == user_id
        ).first() is not None
    if has_booking:
        root_id = get_external_root_event_id()
        if root_id:
            ids.add(root_id)
    return ids


def is_registered(user_id: int, main_event_id: str) -> bool:
    return main_event_id in get_registered_event_ids(user_id)


def register(user_id: int, main_event_id: str) -> None:
    """Idempotent: a second call, or a lost race, is not an error."""
    try:
        with get_session() as session:
            exists = session.query(MainEventAttendeeTable).filter_by(
                event_id=main_event_id, user_id=user_id
            ).first()
            if not exists:
                session.add(MainEventAttendeeTable(event_id=main_event_id, user_id=user_id))
                session.commit()
    except IntegrityError:
        logger.debug(f"Duplicate registration blocked: {main_event_id} user={user_id}")


def unregister(user_id: int, main_event_id: str) -> None:
    """Removes the explicit registration only; a booking-derived one stays."""
    with get_session() as session:
        session.query(MainEventAttendeeTable).filter_by(
            event_id=main_event_id, user_id=user_id
        ).delete()
        session.commit()
