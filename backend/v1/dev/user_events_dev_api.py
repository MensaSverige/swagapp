import datetime
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from v1.db.database import get_session
from v1.db.tables import UserTable, UserEventTable
from v1.user_events.user_events_model import ExtendedUserEvent, UserEvent
from v1.user_events.user_events_db import get_safe_user_event, create_user_event
from v1.utilities import get_current_time


class StatusResponseWithMessage(BaseModel):
    message: str


dev_user_events = APIRouter(prefix="/v1")


def _ensure_dummy_user(session):
    """Ensure the dummy user exists."""
    existing = session.query(UserTable).filter_by(userId=1337).first()
    if not existing:
        session.add(UserTable(
            userId=1337,
            isMember=False,
            firstName="Dummy",
            lastName="User",
            contact_email="dummy@user.com",
            show_location="NO_ONE",
            show_email=False,
            show_phone=False,
            location_update_interval_seconds=60,
            events_refresh_interval_seconds=60,
            background_location_updates=False,
        ))
    else:
        existing.firstName = "Dummy"
        existing.lastName = "User"
        existing.contact_email = "dummy@user.com"
    session.commit()


@dev_user_events.get("/dev/clear_user_events",
                     response_model=StatusResponseWithMessage)
async def clear_user_events():
    with get_session() as session:
        session.query(UserEventTable).delete()
        session.commit()
    return {"message": "User events cleared"}


@dev_user_events.get("/dev/create_dummy_user_event",
                     response_model=ExtendedUserEvent)
async def get_dummy_user_event():
    with get_session() as session:
        _ensure_dummy_user(session)

    dummy_event = UserEvent(
        userId=1337,
        name="Dummy Event",
        description="This is a dummy event",
        start=get_current_time().replace(tzinfo=None) + datetime.timedelta(hours=20),
        end=get_current_time().replace(tzinfo=None) + datetime.timedelta(hours=25),
        maxAttendees=10,
        hosts=[],
        suggested_hosts=[],
        attendees=[],
        reports=[],
    )
    event_id = create_user_event(dummy_event)

    event = get_safe_user_event(str(event_id))
    if not event:
        raise HTTPException(status_code=404,
                            detail="Event not created. Insert ID: " +
                            str(event_id))
    return event


@dev_user_events.get("/dev/create_my_dummy_event",
                     response_model=ExtendedUserEvent)
async def create_my_dummy_event():
    with get_session() as session:
        _ensure_dummy_user(session)

    userId = int(os.getenv('MY_USER_ID'))

    dummy_event = UserEvent(
        userId=userId,
        name="My Dummy Event",
        description="This is a dummy event for the dev running the server (you)",
        start=get_current_time().replace(tzinfo=None) + datetime.timedelta(hours=20),
        end=get_current_time().replace(tzinfo=None) + datetime.timedelta(hours=25),
        maxAttendees=10,
        hosts=[],
        suggested_hosts=[],
        attendees=[{"userId": 1337}],
        reports=[],
    )
    event_id = create_user_event(dummy_event)

    event = get_safe_user_event(str(event_id))
    if not event:
        raise HTTPException(status_code=404,
                            detail="Event not created. Insert ID: " +
                            str(event_id))
    return event
