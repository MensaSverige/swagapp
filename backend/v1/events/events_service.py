from __future__ import annotations
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from v1.events.events_model import Event
from v1.events.events_mappers import map_external_event, map_user_event, map_event_to_user_event
from v1.db.external_events import get_stored_external_event_details, get_all_stored_external_event_details
from v1.external.event_api import get_booked_external_events, book_external_event, unbook_external_event
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
    """Attend a unified event - handles both user events and external events."""
    logging.info(f"Attempting to attend event: {unified_event_id} by user: {current_user.get('userId')}")
    
    # Route based on event ID prefix
    if unified_event_id.startswith("usr"):
        return _attend_user_event(unified_event_id, current_user)
    elif unified_event_id.startswith("ext"):
        return _attend_external_event(unified_event_id, current_user)
    else:
        logging.error(f"Invalid event ID format: {unified_event_id}")
        raise HTTPException(status_code=400, detail="Invalid event ID format")


def _attend_user_event(unified_event_id: str, current_user: dict) -> Event:
    """Attend a user event (internal implementation)."""
    event_id = unified_event_id[3:]  # Remove 'usr' prefix
    logging.info(f"Extracted user event_id: {event_id}, length: {len(event_id)}")
    
    # Validate the event ID format
    if len(event_id) != 24:
        logging.error(f"Invalid event ID length: {len(event_id)}, expected 24")
        raise HTTPException(status_code=400, detail=f"Invalid event ID format: expected 24 characters, got {len(event_id)}")
    
    existing = db_get_safe_user_event(event_id)
    if not existing:
        logging.error(f"Event not found: {event_id}")
        raise HTTPException(status_code=404, detail="Event not found")
    
    logging.info(f"Found event: {existing.name}, owner: {existing.userId}")
    
    if existing.userId == current_user["userId"]:
        logging.error(f"Owner {current_user['userId']} cannot attend their own event")
        raise HTTPException(status_code=400, detail="Owner cannot attend their own event")
    
    # Check if event is already at max capacity
    if existing.maxAttendees is not None and len(existing.attendees) >= existing.maxAttendees:
        logging.error(f"Event at max capacity: {len(existing.attendees)}/{existing.maxAttendees}")
        raise HTTPException(status_code=400, detail="Event is at maximum capacity")
    
    # Check if user is already attending
    if any(attendee.userId == current_user["userId"] for attendee in existing.attendees):
        logging.error(f"User {current_user['userId']} already attending event")
        raise HTTPException(status_code=400, detail="User is already attending this event")
    
    logging.info(f"Adding user {current_user['userId']} to event {event_id}")
    ok = db_add_attendee_to_user_event(event_id, current_user["userId"])
    if not ok:
        logging.error(f"Failed to add attendee {current_user['userId']} to event {event_id}")
        raise HTTPException(status_code=500, detail="Failed to attend event")
    
    updated = db_get_safe_user_event(event_id)
    if not updated:
        logging.error(f"Failed to load updated event {event_id}")
        raise HTTPException(status_code=500, detail="Failed to load updated event")
    
    logging.info(f"Successfully added user {current_user['userId']} to event {event_id}")
    return map_user_event(updated, current_user["userId"])


def _attend_external_event(unified_event_id: str, current_user: dict) -> Event:
    """Attend an external event by booking it (internal implementation)."""
    event_id_str = unified_event_id[3:]  # Remove 'ext' prefix
    
    try:
        # Convert string eventId to int for the external API
        event_id = int(event_id_str)
    except ValueError:
        logging.error(f"Invalid eventId format: {event_id_str}")
        raise HTTPException(status_code=400, detail=f"Invalid event ID: {event_id_str}")
    
    try:
        # For external events, "attending" means booking
        result = book_external_event(current_user["userId"], event_id)
        logging.info(f"Successfully booked external event {event_id} for user {current_user['userId']}")
        
        # Try to find the event in our stored external events to return proper data
        try:
            external_events_details = get_all_stored_external_event_details()
            for event_detail in external_events_details:
                if event_detail.eventId == event_id:  # Compare as int
                    # Create booked_ids set that definitely includes this event
                    booked_ids = {event_id}  # Use int eventId
                    
                    # Also try to get existing booked events (but don't fail if this doesn't work)
                    try:
                        existing_booked = get_booked_external_events(current_user["userId"])
                        booked_ids.update(e.eventId for e in existing_booked)
                        logging.info(f"Found {len(existing_booked)} existing booked events for user {current_user['userId']}")
                    except Exception as e:
                        logging.warning(f"Could not fetch existing booked events, using just current booking: {e}")
                    
                    logging.info(f"Mapping external event {event_id} with booked_ids: {booked_ids}")
                    
                    # Map the external event with updated booking status
                    mapped_event = map_external_event(event_detail, current_user["userId"], booked_ids)
                    if mapped_event:
                        # Double-check: Force attending to True since we just successfully booked
                        mapped_event.attending = True
                        mapped_event.bookable = False  # Can't book again since already booked
                        logging.info(f"Returning mapped event with attending: {mapped_event.attending}")
                        return mapped_event
                    else:
                        logging.error(f"map_external_event returned None for event {event_id}")
            
            # If we can't find the specific event, create a basic response
            logging.warning(f"Could not find external event {event_id} in stored events, total stored: {len(external_events_details)}")
            
        except Exception as e:
            logging.error(f"Failed to fetch updated external event data: {e}", exc_info=True)
        
        # Fallback: Create a minimal Event response with attending=True
        from v1.events.events_model import Event
        from datetime import datetime
        
        return Event(
            eventId=unified_event_id,
            name="External Event",
            start=datetime.now(),
            end=datetime.now(),
            attending=True,  # This is the key fix - ensure attending is True
            bookable=False,  # Not bookable anymore since we just booked it
            official=True,
            attendeeCount=0,
            maxAttendees=None,
            description="Successfully booked external event",
            location=None,
            host=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to attend external event {event_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to attend event")
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to attend external event {event_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to attend event")


def unattend_event_via_unified(unified_event_id: str, current_user: dict) -> dict:
    """Unattend a unified event - handles both user events and external events."""
    # Route based on event ID prefix
    if unified_event_id.startswith("usr"):
        return _unattend_user_event(unified_event_id, current_user)
    elif unified_event_id.startswith("ext"):
        return _unattend_external_event(unified_event_id, current_user)
    else:
        raise HTTPException(status_code=400, detail="Invalid event ID format")


def _unattend_user_event(unified_event_id: str, current_user: dict) -> dict:
    """Unattend a user event (internal implementation)."""
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


def _unattend_external_event(unified_event_id: str, current_user: dict) -> dict:
    """Unattend an external event by unbooking it (internal implementation)."""
    event_id_str = unified_event_id[3:]  # Remove 'ext' prefix
    
    try:
        # Convert string eventId to int for the external API
        event_id = int(event_id_str)
    except ValueError:
        logging.error(f"Invalid eventId format: {event_id_str}")
        raise HTTPException(status_code=400, detail=f"Invalid event ID: {event_id_str}")
    
    try:
        # For external events, "unattending" means unbooking
        result = unbook_external_event(current_user["userId"], event_id)
        logging.info(f"Successfully unbooked external event {event_id} for user {current_user['userId']}")
        return {"message": "Successfully unattended event", "result": result}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to unattend external event {event_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to unattend event")


def book_external_event_via_unified(unified_event_id: str, current_user: dict) -> dict:
    """Book an external event (only external events can be booked via this endpoint)."""
    # Only external events support booking via this unified API
    if not unified_event_id.startswith("ext"):
        raise HTTPException(status_code=400, detail="Only external events can be booked via this endpoint")
    
    event_id = unified_event_id[3:]  # Remove 'ext' prefix
    
    try:
        result = book_external_event(current_user["userId"], event_id)
        return {"message": "Successfully booked event", "result": result}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to book external event {event_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to book event")


def unbook_external_event_via_unified(unified_event_id: str, current_user: dict) -> dict:
    """Unbook an external event (only external events can be unbooked via this endpoint)."""
    # Only external events support unbooking via this unified API
    if not unified_event_id.startswith("ext"):
        raise HTTPException(status_code=400, detail="Only external events can be unbooked via this endpoint")
    
    event_id = unified_event_id[3:]  # Remove 'ext' prefix
    
    try:
        result = unbook_external_event(current_user["userId"], event_id)
        return {"message": "Successfully unbooked event", "result": result}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to unbook external event {event_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to unbook event")
