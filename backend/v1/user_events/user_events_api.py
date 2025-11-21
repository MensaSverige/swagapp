import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from v1.db.models.user import User
from v1.request_filter import validate_request, require_member
from v1.db.mongo import user_collection
import v1.user_events.user_events_db as db
from v1.user_events.user_events_model import UserEvent, ExtendedUserEvent

user_events_v1 = APIRouter(prefix="/v1")

@user_events_v1.get("/user_events", response_model=List[ExtendedUserEvent])
async def get_events(current_user: User = Depends(require_member)):
    dummy_event = ExtendedUserEvent(
        id="outdated_app_notice",
        title="Uppdatera appen",
        description="Den här versionen av appen är utdaterad. Vänligen uppdatera till den senaste versionen för att fortsätta använda alla funktioner.\n\n<a href=\"https://play.google.com/store/apps/details?id=se.mensasverige\">Android - Google Play</a>\n\n<a href=\"https://apps.apple.com/se/app/mensa-sverige/id6755419896\">iOS - App Store</a>",
        date="2025-11-23",
        userId=0,
        location="",
        latitude=0.0,
        longitude=0.0,
        attendees=[],
        hosts=[],
        reports=[],
        ownerName="System",
        attendeeNames=[],
        hostNames=[]
    )
    
    return [dummy_event]
