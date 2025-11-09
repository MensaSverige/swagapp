from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, Query

from v1.events.events_model import Event
from v1.events.events_service import list_unified_events
from v1.request_filter import require_member


unified_events_v1 = APIRouter(prefix="/v1")


@unified_events_v1.get("/events", response_model=List[Event])
async def get_events(
    attending: Optional[bool] = Query(None),
    bookable: Optional[bool] = Query(None),
    official: Optional[bool] = Query(None),
    current_user: dict = Depends(require_member),
):
    return list_unified_events(
        current_user_id=current_user["userId"],
        attending=attending,
        bookable=bookable,
        official=official,
    )


@unified_events_v1.get("/events/attending", response_model=List[Event])
async def get_events_attending(current_user: dict = Depends(require_member)):
    return list_unified_events(current_user_id=current_user["userId"], attending=True)


@unified_events_v1.get("/events/official", response_model=List[Event])
async def get_events_official(current_user: dict = Depends(require_member)):
    return list_unified_events(current_user_id=current_user["userId"], official=True)


@unified_events_v1.get("/events/unofficial", response_model=List[Event])
async def get_events_unofficial(current_user: dict = Depends(require_member)):
    return list_unified_events(current_user_id=current_user["userId"], official=False)
