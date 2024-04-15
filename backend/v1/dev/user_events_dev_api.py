import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.mongo import user_collection, user_event_collection
from user_events.user_events_model import ExtendedUserEvent
from user_events.user_events_db import get_safe_user_event


class StatusResponseWithMessage(BaseModel):
    message: str


dev_user_events = APIRouter(prefix="/v1")


@dev_user_events.get("/dev/clear_user_events",
                     response_model=StatusResponseWithMessage)
async def clear_user_events():
    user_event_collection.delete_many({})
    return {"message": "User events cleared"}


@dev_user_events.get("/dev/create_dummy_user_event",
                     response_model=ExtendedUserEvent)
async def get_dummy_user_event():
    # Generate dummy user event
    dummy_user = {
        'userId': 1337,
        'firstName': "Dummy",
        'lastName': "User",
        'email': "dummy@user.com",
    }
    user_collection.update_one({"userId": dummy_user['userId']},
                               {"$set": dummy_user},
                               upsert=True)
    dummy_event = {
        'userId': 1337,
        'name': "Dummy Event",
        'description': "This is a dummy event",
        'start': datetime.datetime.now() + datetime.timedelta(hours=20),
        'end': datetime.datetime.now() + datetime.timedelta(hours=25),
        'maxAttendees': 10,
    }
    result = user_event_collection.insert_one(dummy_event)

    event = get_safe_user_event(str(result.inserted_id))
    if not event:
        raise HTTPException(status_code=404,
                            detail="Event not created. Insert ID: " +
                            str(result.inserted_id))
    return event
