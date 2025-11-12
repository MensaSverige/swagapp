from __future__ import annotations
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from v1.events.events_model import Event
from v1.events.events_mappers import map_external_event, map_user_event, map_event_to_user_event
from v1.db.external_events import get_stored_external_event_details, get_all_stored_external_event_details
from v1.external.event_api import get_booked_external_events
from v1.user_events.user_events_db import (
    get_safe_future_user_events,
    get_safe_user_events_since,
    create_user_event as db_create_user_event,
    update_user_event as db_update_user_event,
    delete_user_event as db_delete_user_event,
    get_safe_user_event as db_get_safe_user_event,
    add_attendee_to_user_event as db_add_attendee_to_user_event,
    remove_attendee_from_user_event as db_remove_attendee_from_user_event,
)
from v1.user_events.user_events_model import UserEvent, Host as UEHost, Attendee as UEAttendee, Location as UELocation
from v1.utilities import get_current_time
from fastapi import HTTPException


def list_unified_events(
    current_user_id: int,
    attending: Optional[bool] = None,
    bookable: Optional[bool] = None,
    official: Optional[bool] = None,
) -> List[Event]:
    """Fetch, map, merge and filter events from both sources.

    Filters follow semantics: if param is None -> include both states; else match exact state.
    """
    # External events
    try:
        booked_external = get_booked_external_events(current_user_id)
        booked_ids = {e.eventId for e in booked_external}
    except Exception as e:
        logging.error(f"Failed to fetch booked external events: {e}")
        booked_ids = set()

    try:
        # Now fetch ALL external events (not just booked/admin)
        external_events_details = get_all_stored_external_event_details()
    except Exception as e:
        logging.error(f"Failed to fetch all external events: {e}")
        external_events_details = []

    external_events: List[Event] = []
    for d in external_events_details:
        mapped = map_external_event(d, current_user_id, booked_ids)
        if mapped:
            external_events.append(mapped)

    # User events (already filtered to future via db function)
    try:
        # Include events starting from one month back
        one_month_back = get_current_time() - timedelta(days=30)
        user_events = get_safe_user_events_since(one_month_back.replace(tzinfo=None))
    except Exception as e:
        logging.error(f"Failed to fetch user events since range: {e}")
        user_events = []
    user_events_mapped = [map_user_event(u, current_user_id) for u in user_events]

    merged = external_events + user_events_mapped

    # Do not filter to future only; keep all external events and user events from one month back.

    def passes(flag_val: Optional[bool], actual: bool) -> bool:
        return flag_val is None or flag_val == actual

    filtered = [
        e for e in merged
        if passes(attending, e.attending) and passes(bookable, e.bookable)
        and passes(official, e.official)
    ]

    filtered.sort(key=lambda e: (e.start, e.name.lower()))
    return filtered



def create_user_event_via_unified(event: Event, current_user: dict) -> Event:
    if event.official:
        raise HTTPException(status_code=400, detail="Cannot create official events via this endpoint")
    owner_id = current_user["userId"]
    ue = map_event_to_user_event(event, owner_id)
    created_id = db_create_user_event(ue)
    if not created_id:
        raise HTTPException(status_code=500, detail="Failed to create user event")
    created = db_get_safe_user_event(str(created_id))
    if not created:
        raise HTTPException(status_code=500, detail="Failed to load created event")
    return map_user_event(created, owner_id)


def update_user_event_via_unified(unified_event_id: str, event: Event, current_user: dict) -> Event:
    if event.official:
        raise HTTPException(status_code=400, detail="Cannot update official events via this endpoint")
    # Expect unified id like usr<mongoId>
    if not unified_event_id.startswith("usr"):
        raise HTTPException(status_code=400, detail="Only user events can be updated here")
    event_id = unified_event_id[3:]  # Remove 'usr' prefix
    
    existing = db_get_safe_user_event(event_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")
    if existing.userId != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Preserve attendees/reports from existing, rebuild from incoming unified event
    ue = map_event_to_user_event(event, existing.userId, existing)
    ok = db_update_user_event(event_id, ue)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update user event")
    updated = db_get_safe_user_event(event_id)
    return map_user_event(updated, current_user["userId"]) if updated else map_user_event(ue, current_user["userId"]) 


def delete_user_event_via_unified(unified_event_id: str, current_user: dict) -> dict:
    # Expect unified id like usr<mongoId>
    if not unified_event_id.startswith("usr"):
        raise HTTPException(status_code=400, detail="Only user events can be deleted here")
    event_id = unified_event_id[3:]  # Remove 'usr' prefix

    existing = db_get_safe_user_event(event_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")
    if existing.userId != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    ok = db_delete_user_event(event_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to delete user event")
    return {"message": "Event deleted successfully"}


def attend_event_via_unified(unified_event_id: str, current_user: dict) -> Event:
    """Attend a unified event (only user events can be attended via this endpoint)."""
    # Only user events support attendance via this unified API
    if not unified_event_id.startswith("usr"):
        raise HTTPException(status_code=400, detail="Only user events can be attended via this endpoint")
    
    event_id = unified_event_id[3:]  # Remove 'usr' prefix
    
    existing = db_get_safe_user_event(event_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")
    if existing.userId == current_user["userId"]:
        raise HTTPException(status_code=400, detail="Owner cannot attend their own event")
    
    ok = db_add_attendee_to_user_event(event_id, current_user["userId"])
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to attend event")
    
    updated = db_get_safe_user_event(event_id)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to load updated event")
    
    return map_user_event(updated, current_user["userId"])


def unattend_event_via_unified(unified_event_id: str, current_user: dict) -> dict:
    """Unattend a unified event (only user events can be unattended via this endpoint)."""
    # Only user events support attendance via this unified API
    if not unified_event_id.startswith("usr"):
        raise HTTPException(status_code=400, detail="Only user events can be unattended via this endpoint")
    
    event_id = unified_event_id[3:]  # Remove 'usr' prefix
    
    existing = db_get_safe_user_event(event_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")
    if existing.userId == current_user["userId"]:
        raise HTTPException(status_code=400, detail="Owner cannot unattend their own event")
    
    ok = db_remove_attendee_from_user_event(event_id, current_user["userId"])
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to unattend event")
    
    return {"message": "Successfully unattended event"}
