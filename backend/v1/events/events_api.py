from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, Query

from v1.events.events_model import Event
from v1.events.events_service import (
    list_unified_events,
    create_user_event_via_unified,
    update_user_event_via_unified,
    delete_user_event_via_unified,
    attend_event_via_unified,
    unattend_event_via_unified,
)
from v1.events.events_model import Event as UnifiedEvent
from fastapi import HTTPException
from v1.request_filter import validate_request


unified_events_v1 = APIRouter(prefix="/v1")


@unified_events_v1.get("/events", response_model=List[Event])
async def get_events(
    attending: Optional[bool] = Query(None),
    bookable: Optional[bool] = Query(None),
    official: Optional[bool] = Query(None),
    current_user: dict = Depends(validate_request),
):
    return list_unified_events(
        current_user=current_user,
        attending=attending,
        bookable=bookable,
        official=official,
    )


@unified_events_v1.post("/events", response_model=UnifiedEvent)
async def create_event_proxy(event: UnifiedEvent, current_user: dict = Depends(validate_request)):
    return create_user_event_via_unified(event, current_user)


@unified_events_v1.put("/events/{event_id}", response_model=UnifiedEvent)
async def update_event_proxy(event_id: str, event: UnifiedEvent, current_user: dict = Depends(validate_request)):
    return update_user_event_via_unified(event_id, event, current_user)


@unified_events_v1.delete("/events/{event_id}")
async def delete_event_proxy(event_id: str, current_user: dict = Depends(validate_request)):
    return delete_user_event_via_unified(event_id, current_user)


@unified_events_v1.get("/events/attending", response_model=List[Event])
async def get_events_attending(current_user: dict = Depends(validate_request)):
    return list_unified_events(current_user=current_user, attending=True)


@unified_events_v1.get("/events/official", response_model=List[Event])
async def get_events_official(current_user: dict = Depends(validate_request)):
    return list_unified_events(current_user=current_user, official=True)


@unified_events_v1.get("/events/unofficial", response_model=List[Event])
async def get_events_unofficial(current_user: dict = Depends(validate_request)):
    return list_unified_events(current_user=current_user, official=False)


@unified_events_v1.post("/events/{event_id}/attend", response_model=Event)
async def attend_event(event_id: str, current_user: dict = Depends(validate_request)):
    """Attend an event. Works for both user events (usr prefix) and external events (ext prefix)."""
    try:
        return attend_event_via_unified(event_id, current_user)
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.error(f"Unexpected error in attend_event: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@unified_events_v1.post("/events/{event_id}/unattend")
async def unattend_event(event_id: str, current_user: dict = Depends(validate_request)):
    """Unattend an event. Works for both user events (usr prefix) and external events (ext prefix)."""
    return unattend_event_via_unified(event_id, current_user)
