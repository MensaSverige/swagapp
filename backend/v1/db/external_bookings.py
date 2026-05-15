from __future__ import annotations
import logging
from typing import Dict, List, Set
from pymongo import UpdateOne
from v1.db.mongo import external_event_bookings_collection


def upsert_user_bookings(userId: int, event_ids: List[int]) -> None:
    """Replace all bookings for userId with the given event_ids."""
    if not event_ids:
        delete_user_bookings(userId)
        return
    ops = [
        UpdateOne(
            {"userId": userId, "eventId": eid},
            {"$setOnInsert": {"userId": userId, "eventId": eid}},
            upsert=True,
        )
        for eid in event_ids
    ]
    try:
        external_event_bookings_collection.bulk_write(ops, ordered=False)
        external_event_bookings_collection.delete_many(
            {"userId": userId, "eventId": {"$nin": event_ids}}
        )
    except Exception as e:
        logging.error(f"[external_bookings] upsert_user_bookings failed for userId={userId}: {e}")


def delete_user_bookings(userId: int) -> None:
    """Remove all booking records for a user."""
    try:
        external_event_bookings_collection.delete_many({"userId": userId})
    except Exception as e:
        logging.error(f"[external_bookings] delete_user_bookings failed for userId={userId}: {e}")


def delete_booking(userId: int, eventId: int) -> None:
    """Remove a single booking record."""
    try:
        external_event_bookings_collection.delete_one({"userId": userId, "eventId": eventId})
    except Exception as e:
        logging.error(f"[external_bookings] delete_booking failed userId={userId} eventId={eventId}: {e}")


def add_booking(userId: int, eventId: int) -> None:
    """Insert a single booking record (idempotent)."""
    try:
        external_event_bookings_collection.update_one(
            {"userId": userId, "eventId": eventId},
            {"$setOnInsert": {"userId": userId, "eventId": eventId}},
            upsert=True,
        )
    except Exception as e:
        logging.error(f"[external_bookings] add_booking failed userId={userId} eventId={eventId}: {e}")


def get_bookings_by_event_ids(event_ids: List[int]) -> Dict[int, Set[int]]:
    """Return {eventId: set(userIds)} for all given eventIds."""
    if not event_ids:
        return {}
    try:
        result: Dict[int, Set[int]] = {}
        for doc in external_event_bookings_collection.find({"eventId": {"$in": event_ids}}):
            result.setdefault(doc["eventId"], set()).add(doc["userId"])
        return result
    except Exception as e:
        logging.error(f"[external_bookings] get_bookings_by_event_ids failed: {e}")
        return {}
