"""Reads and writes member calendar events in the unified `events` table.

Rows are stored in the unified shape, tagged `source = calendar`, which is how
the MongoDB `unifiedevents` collection worked before the PostgreSQL cutover.
The mapping therefore happens on write: `map_member_calendar_event` turns a
`MemberCalendarEvent` into an `Event`, and a read hands the row straight back
as an `Event`.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List

from v1.db.database import get_session
from v1.db.tables import EventTable
from v1.events.events_mappers import map_member_calendar_event
from v1.events.events_model import Event, EventSource
from v1.member_calendar.calendar_model import MemberCalendarEvent
from v1.utilities import ensure_aware


logger = logging.getLogger(__name__)

SOURCE = EventSource.calendar.value

# Columns rewritten on every sync. `source`/`source_id` identify the row and
# are never reassigned; `created_at` records when we first saw it.
_MUTABLE_FIELDS = (
    "parentEvent", "name", "description",
    "location_description", "location_address", "location_marker",
    "location_latitude", "location_longitude",
    "start", "end", "cancelled",
    "imageUrl", "bookingStart", "bookingEnd", "showAttendees",
    "maxAttendees", "price", "official",
    "admin", "hosts", "tags", "extras",
    "source_created_at", "source_updated_at",
)


def _utc(dt):
    """Localize a naive datetime, then normalize it to UTC.

    The member site reports Swedish local wall-clock times with no offset, so
    `ensure_aware` attaches the Stockholm offset first -- otherwise a
    timestamptz column reads 19:00 as 19:00 UTC, i.e. 21:00 local in summer.

    Normalizing to UTC afterwards is what keeps the `start >= cutoff` filter in
    `get_member_calendar_events_since` honest: SQLite (used by the tests) drops
    the offset on write, so a Stockholm-offset value would be stored as a
    Stockholm wall clock and then compared against a UTC one, over-matching by
    the offset. PostgreSQL normalizes to UTC internally either way, so this
    changes nothing there.
    """
    if dt is None:
        return None
    return ensure_aware(dt).astimezone(timezone.utc)


def _row_values(event: Event, calendar_event: MemberCalendarEvent) -> dict:
    """Column values for one mapped event."""
    return {
        "source": SOURCE,
        "source_id": event.sourceId,
        "parentEvent": event.parentEvent,
        "name": event.name,
        "description": event.description,
        "location_description": event.locationDescription,
        "location_address": event.address,
        "location_marker": event.locationMarker,
        "location_latitude": event.latitude,
        "location_longitude": event.longitude,
        "start": _utc(event.start),
        "end": _utc(event.end),
        "cancelled": _utc(event.cancelled),
        "imageUrl": event.imageUrl,
        "bookingStart": _utc(event.bookingStart),
        "bookingEnd": _utc(event.bookingEnd),
        "showAttendees": event.showAttendees.value,
        "maxAttendees": event.maxAttendees,
        "price": event.price,
        "official": event.official,
        "admin": list(event.admin),
        "hosts": [h.model_dump() for h in event.hosts],
        "tags": [t.model_dump() for t in event.tags],
        "extras": dict(event.extras),
        "source_created_at": _utc(calendar_event.created),
        "source_updated_at": _utc(calendar_event.last_modified),
    }


def store_member_calendar_events(calendar_events: List[MemberCalendarEvent]) -> int:
    """Upsert calendar events on (source, source_id). Returns the number stored.

    One transaction per event, matching `store_external_event_details`: a
    single malformed event then fails alone instead of discarding the sync.
    """
    stored_count = 0
    for calendar_event in calendar_events:
        try:
            values = _row_values(map_member_calendar_event(calendar_event), calendar_event)
            with get_session() as session:
                existing = session.query(EventTable).filter_by(
                    source=SOURCE, source_id=values["source_id"]
                ).first()
                if existing:
                    for field in _MUTABLE_FIELDS:
                        setattr(existing, field, values[field])
                else:
                    session.add(EventTable(**values))
                session.commit()
            stored_count += 1
        except Exception as e:
            logger.error(f"Failed to store calendar event {calendar_event.source_id}: {e}")

    logger.info(f"Successfully stored/updated {stored_count} member calendar events")
    return stored_count


def _to_events(rows) -> List[Event]:
    return [Event(**row.to_dict()) for row in rows]


def get_all_member_calendar_events() -> List[Event]:
    """Every stored member calendar event."""
    try:
        with get_session() as session:
            events = _to_events(session.query(EventTable).filter_by(source=SOURCE).all())
        logger.info(f"Retrieved {len(events)} member calendar events")
        return events
    except Exception as e:
        logger.error(f"Failed to retrieve member calendar events: {e}")
        return []


def get_member_calendar_events_since(start_date: datetime) -> List[Event]:
    """Stored member calendar events starting at or after `start_date`."""
    try:
        # Same frame as the stored values -- see `_utc`.
        cutoff = _utc(start_date)
        with get_session() as session:
            events = _to_events(
                session.query(EventTable)
                .filter(EventTable.source == SOURCE, EventTable.start >= cutoff)
                .all()
            )
        logger.info(f"Retrieved {len(events)} member calendar events since {cutoff}")
        return events
    except Exception as e:
        logger.error(f"Failed to retrieve member calendar events since {start_date}: {e}")
        return []


def delete_member_calendar_event(source_id: str) -> bool:
    """Delete one calendar event by its source id. True if a row was removed."""
    try:
        with get_session() as session:
            deleted = session.query(EventTable).filter_by(
                source=SOURCE, source_id=source_id
            ).delete()
            session.commit()
        if deleted:
            logger.info(f"Deleted member calendar event {source_id}")
            return True
        logger.warning(f"No member calendar event found with source id {source_id}")
        return False
    except Exception as e:
        logger.error(f"Failed to delete member calendar event {source_id}: {e}")
        return False


def clear_member_calendar_events() -> int:
    """Delete every stored member calendar event. Returns the number deleted.

    Leaves other sources in the unified table untouched. Intended for tests
    and full-refresh scenarios.
    """
    try:
        with get_session() as session:
            deleted = session.query(EventTable).filter_by(source=SOURCE).delete()
            session.commit()
        logger.info(f"Cleared {deleted} member calendar events")
        return deleted
    except Exception as e:
        logger.error(f"Failed to clear member calendar events: {e}")
        return 0
