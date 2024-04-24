import logging
from typing import List
from fastapi import APIRouter, Depends
from external.event_site_news import get_event_site_news
from db.models.event_site_news import EventSiteNews
from db.external_events import get_stored_external_event_details
from external.event_api import get_booked_external_events
from db.models.user import User
from db.models.external_events import ExternalEvent, ExternalEventDetails
from request_filter import validate_request
from db.users import get_user, get_users
from env_constants import LOGINM_SEED, URL_MEMBER_API

events_v1 = APIRouter(prefix="/v1")

# @events_v1.get("/events")
# async def get_all_events():
#     #todo fetch all events

@events_v1.get("/external_events/booked")
async def get_events_for_user(current_user: User = Depends(validate_request)) -> List[ExternalEventDetails]:
    bookedEvents: ExternalEvent = get_booked_external_events(current_user['userId'])
    logging.info(f"Booked events for user {current_user['userId']}: {bookedEvents}")

    event_ids = [event['eventId'] for event in bookedEvents]
    events = get_stored_external_event_details(event_ids)

    return events

@events_v1.get("/external_events/news") 
async def get_news_from_event_site(current_user: User = Depends(validate_request)) -> List[EventSiteNews]:
    news: EventSiteNews = get_event_site_news()

    return news

# @events_v1.get("/events/detail/{event_id}")
# async def get_event_detail(event_id: int):
#     # todo: fetch event details from event API