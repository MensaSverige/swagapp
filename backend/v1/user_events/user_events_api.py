import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from db.models.user import User
from request_filter import validate_request
from db.mongo import user_collection
import user_events.user_events_db as db
from user_events.user_events_model import UserEvent, ExtendedUserEvent

user_events_v1 = APIRouter(prefix="/v1")


def get_user_name_by_id(user_id: int) -> str:
    user = user_collection.find_one({"userId": user_id})
    if user:
        return f"{user['firstName']} {user['lastName']}"
    return "<unknown>"


class StatusResponseWithMessage(BaseModel):
    message: str


### Listing the user's own events ###
@user_events_v1.get("/user_events/mine",
                    response_model=List[ExtendedUserEvent])
async def get_events_i_own(current_user: dict = Depends(validate_request)):
    events = db.get_safe_user_events_user_owns(current_user['userId'])
    return events


### Events a user is a cohost of ###
@user_events_v1.get("/user_events/cohosting",
                    response_model=List[ExtendedUserEvent])
async def get_events_i_host(current_user: dict = Depends(validate_request)):
    events = db.get_safe_user_events_user_is_hosting(current_user['userId'])
    return events


### Events a user is attending ###
@user_events_v1.get("/user_events/attending",
                    response_model=List[ExtendedUserEvent])
async def get_events_i_attend(current_user: dict = Depends(validate_request)):
    events = db.get_safe_user_events_user_is_attending(current_user['userId'])
    return events


### CRUD operations ###


# Create
@user_events_v1.post("/user_events", response_model=List[ExtendedUserEvent])
async def create_event(event: UserEvent,
                       current_user: dict = Depends(validate_request)):
    event.userId = current_user['userId']

    created_event_id = db.create_user_event(event)
    event = db.get_safe_user_event(created_event_id)
    return event


# Read
@user_events_v1.get("/user_events/{event_id}",
                    response_model=List[ExtendedUserEvent])
async def get_event(event_id: str):
    event = db.get_safe_user_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


# Update
@user_events_v1.put("/user_events/{event_id}",
                    response_model=ExtendedUserEvent)
async def update_event(event_id: str,
                       updated_event: UserEvent,
                       current_user: dict = Depends(validate_request)):
    event = db.get_safe_user_event(event_id)

    if not event:
        logging.error(f"Event not found: {event_id}")
        raise HTTPException(status_code=404, detail="Event not found")
    if event.userId != current_user['userId']:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if event.userId != updated_event.userId:
        raise HTTPException(status_code=400,
                            detail="Event ID cannot be changed")

    # TODO: Allow the following updates for admin users:

    # Check if there are any added hosts or attendees, which is not allowed
    for host in updated_event.hosts:
        if host not in event.hosts:
            raise HTTPException(
                status_code=400,
                detail=
                "Cannot directly add new hosts to event, only remove. Did you mean to use suggested_hosts?"
            )

    if updated_event.attendees != event.attendees:
        raise HTTPException(
            status_code=400,
            detail=
            "Cannot modify attendees directly. Users can only attend/unattend themselves."
        )

    updated = db.update_user_event(event_id, updated_event)
    if not updated:
        logging.error(f"Failed to update event: {event_id}")
        raise HTTPException(status_code=500, detail="Failed to update event")

    return db.make_safe_user_event(updated_event)


# Delete
@user_events_v1.delete("/user_events/{event_id}",
                       response_model=StatusResponseWithMessage)
async def delete_event(event_id: str,
                       current_user: dict = Depends(validate_request)):
    event = db.get_safe_user_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.userId != current_user['userId']:
        raise HTTPException(status_code=403, detail="Unauthorized")

    result = db.delete_user_event(event_id)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to delete event")

    return {"message": "Event deleted successfully"}


### List all future events ###
@user_events_v1.get("/user_events")
async def get_events(_: User = Depends(validate_request)):
    events = db.get_safe_future_user_events()
    return events


### Attendee operations ###


## Attend an event
@user_events_v1.post("/user_events/{event_id}/attend",
                     response_model=StatusResponseWithMessage)
async def attend_event(event_id: int,
                       current_user: dict = Depends(validate_request)):
    event = db.get_safe_user_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.userId == current_user['userId']:
        raise HTTPException(status_code=400,
                            detail="Owner cannot attend their own event")
    updates = db.add_attendee_to_user_event(event_id, current_user['userId'])
    if not updates:
        raise HTTPException(status_code=500, detail="Failed to attend event")

    return {"message": "User is now attending the event"}


## Unattend an event
@user_events_v1.post("/user_events/{event_id}/unattend",
                     response_model=StatusResponseWithMessage)
async def unattend_event(event_id: int,
                         current_user: dict = Depends(validate_request)):
    event = db.get_safe_user_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.userId == current_user['userId']:
        raise HTTPException(status_code=400,
                            detail="Owner cannot unattend their own event")

    updates = db.remove_attendee_from_user_event(event_id,
                                                 current_user['userId'])
    if not updates:
        raise HTTPException(status_code=500, detail="Failed to unattend event")

    return {"message": "User is no longer attending the event"}


### Host operations ###


## Accept invitation to cohost an event
@user_events_v1.post("/user_events/{event_id}/accept_cohosting",
                     response_model=StatusResponseWithMessage)
async def accept_being_cohost(event_id: int,
                              current_user: dict = Depends(validate_request)):
    event = db.get_safe_user_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.userId != current_user['userId']:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if event.suggested_hosts and current_user['userId'] not in event[
            "suggested_hosts"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot accept being a cohost without being suggested first"
        )
    updates = db.add_user_as_host_to_user_event(event_id,
                                                current_user['userId'])
    if not updates:
        raise HTTPException(status_code=500, detail="Failed to add host")

    return {"message": "Host added to the event"}


## Deny an invitation to cohost an event
@user_events_v1.post("/user_events/{event_id}/deny_cohosting",
                     response_model=StatusResponseWithMessage)
async def deny_being_cohost(event_id: int,
                            current_user: dict = Depends(validate_request)):
    event = db.get_safe_user_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.userId != current_user['userId']:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if event.suggested_hosts and current_user['userId'] not in event[
            "suggested_hosts"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot deny being a cohost without being suggested first")
    updates = db.remove_user_host_invitation_from_user_event(
        event_id, current_user['userId'])
    if not updates:
        raise HTTPException(status_code=500, detail="Failed to remove host")

    return {"message": "Host removed from the event"}
