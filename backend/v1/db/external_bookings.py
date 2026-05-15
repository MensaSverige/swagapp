from __future__ import annotations
import logging
from typing import Dict, List, Set
from v1.db.database import get_session
from v1.db.tables import ExternalEventBookingTable


def upsert_user_bookings(userId: int, event_ids: List[int]) -> None:
    """Replace all bookings for userId with the given event_ids."""
    if not event_ids:
        delete_user_bookings(userId)
        return
    try:
        with get_session() as session:
            existing = {
                row.eventId for row in
                session.query(ExternalEventBookingTable.eventId)
                .filter_by(userId=userId).all()
            }
            to_add = set(event_ids) - existing
            to_remove = existing - set(event_ids)
            for eid in to_add:
                session.add(ExternalEventBookingTable(userId=userId, eventId=eid))
            if to_remove:
                session.query(ExternalEventBookingTable).filter(
                    ExternalEventBookingTable.userId == userId,
                    ExternalEventBookingTable.eventId.in_(to_remove),
                ).delete(synchronize_session=False)
            session.commit()
    except Exception as e:
        logging.error(f"[external_bookings] upsert_user_bookings failed for userId={userId}: {e}")


def delete_user_bookings(userId: int) -> None:
    """Remove all booking records for a user."""
    try:
        with get_session() as session:
            session.query(ExternalEventBookingTable).filter_by(userId=userId).delete()
            session.commit()
    except Exception as e:
        logging.error(f"[external_bookings] delete_user_bookings failed for userId={userId}: {e}")


def delete_booking(userId: int, eventId: int) -> None:
    """Remove a single booking record."""
    try:
        with get_session() as session:
            session.query(ExternalEventBookingTable).filter_by(
                userId=userId, eventId=eventId
            ).delete()
            session.commit()
    except Exception as e:
        logging.error(f"[external_bookings] delete_booking failed userId={userId} eventId={eventId}: {e}")


def add_booking(userId: int, eventId: int) -> None:
    """Insert a single booking record (idempotent)."""
    try:
        with get_session() as session:
            exists = session.query(ExternalEventBookingTable).filter_by(
                userId=userId, eventId=eventId
            ).first()
            if not exists:
                session.add(ExternalEventBookingTable(userId=userId, eventId=eventId))
                session.commit()
    except Exception as e:
        logging.error(f"[external_bookings] add_booking failed userId={userId} eventId={eventId}: {e}")


def get_bookings_by_event_ids(event_ids: List[int]) -> Dict[int, Set[int]]:
    """Return {eventId: set(userIds)} for all given eventIds."""
    if not event_ids:
        return {}
    try:
        with get_session() as session:
            rows = session.query(ExternalEventBookingTable).filter(
                ExternalEventBookingTable.eventId.in_(event_ids)
            ).all()
            result: Dict[int, Set[int]] = {}
            for row in rows:
                result.setdefault(row.eventId, set()).add(row.userId)
            return result
    except Exception as e:
        logging.error(f"[external_bookings] get_bookings_by_event_ids failed: {e}")
        return {}
