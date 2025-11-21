import logging
from typing import List
from fastapi import APIRouter, Depends
from v1.external.event_site_news import get_event_site_news
from v1.db.models.event_site_news import EventSiteNews
from v1.db.external_events import get_stored_external_event_details, get_stored_external_root
from v1.external.event_api import get_booked_external_events
from v1.db.models.user import User
from v1.db.models.external_events import ExternalEvent, ExternalEventDetails, ExternalRoot
from v1.request_filter import validate_request
from v1.env_constants import LOGINM_SEED, URL_MEMBER_API

events_v1 = APIRouter(prefix="/v1")

@events_v1.get("/external_root")
async def get_external_root_data() -> ExternalRoot:
    root = get_stored_external_root()

    return root

@events_v1.get("/external_events/booked")
async def get_events_for_user(current_user: User = Depends(
    validate_request)) -> List[ExternalEventDetails]:
    from datetime import datetime
    
    dummy_event = ExternalEventDetails(
        eventId=999999,
        eventDate=datetime.strptime("2025-11-23 10:00", "%Y-%m-%d %H:%M"),
        startTime="10:00",
        endTime="11:00",
        titel="Uppdatera appen",
        description="Den här versionen av appen är utdaterad. Vänligen uppdatera till den senaste versionen för att fortsätta använda alla funktioner.\n\n<a href=\"https://play.google.com/store/apps/details?id=se.mensasverige\">Android - Google Play</a>\n\n<a href=\"https://apps.apple.com/se/app/mensa-sverige/id6755419896\">iOS - App Store</a>",
        speaker="System",
        location="App Store",
        isFree=True,
        price=0,
        isLimited=False,
        stock=0,
        showBooked=False,
        booked=0,
        eventUrl=""
    )
    
    return [dummy_event]

@events_v1.get("/external_events/news")
async def get_news_from_event_site(current_user: User = Depends(
    validate_request)) -> List[EventSiteNews]:
    static_news = EventSiteNews(
        description="Den här versionen av appen är utdaterad. Vänligen uppdatera till den senaste versionen för att fortsätta använda alla funktioner.\n\n<a href=\"https://play.google.com/store/apps/details?id=se.mensasverige\">Android - Google Play</a>\n\n<a href=\"https://apps.apple.com/se/app/mensa-sverige/id6755419896\">iOS - App Store</a>",
        date="2025-11-21",
        title="Uppdatera appen"
    )

    return [static_news]

