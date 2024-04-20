from typing import List
from fastapi import APIRouter, Depends
from external.event_api import ExternalEvent, get_external_events
from db.models.user import User
from request_filter import validate_request
from db.users import get_user, get_users
from env_constants import LOGINM_SEED, URL_MEMBER_API

events_v1 = APIRouter(prefix="/v1")

# @events_v1.get("/events")
# async def get_all_events():
#     #todo fetch all events

@events_v1.get("/external_events")
async def get_events_for_user(current_user: User = Depends(validate_request)) -> List[ExternalEvent]:
    events = get_external_events(current_user['userId'])
    return events


# @events_v1.get("/events/detail/{event_id}")
# async def get_event_detail(event_id: int):
#     # todo: fetch event details from event API