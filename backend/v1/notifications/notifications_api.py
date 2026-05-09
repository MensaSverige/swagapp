from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from v1.db.mongo import user_collection, user_event_collection
from v1.db.users import add_push_token, get_users_with_push_tokens
from v1.notifications.push_service import send_push_notifications
from v1.request_filter import validate_request

notifications_v1 = APIRouter(prefix="/v1")


class RegisterTokenRequest(BaseModel):
    token: str


class BroadcastRequest(BaseModel):
    title: str
    body: str
    event_id: Optional[str] = None


@notifications_v1.post("/notifications/register-token", status_code=204)
async def register_push_token(
    req: RegisterTokenRequest,
    current_user: dict = Depends(validate_request),
):
    if not req.token.startswith("ExponentPushToken["):
        raise HTTPException(status_code=400, detail="Invalid push token format")
    add_push_token(current_user["userId"], req.token)


@notifications_v1.post("/notifications/broadcast")
async def broadcast_notification(
    req: BroadcastRequest,
    current_user: dict = Depends(validate_request),
):
    if not current_user.get("isAdmin", False):
        raise HTTPException(status_code=403, detail="Admin required")

    if req.event_id:
        raw_id = req.event_id.removeprefix("usr")
        try:
            event = user_event_collection.find_one({"_id": ObjectId(raw_id)})
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid event_id")
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        attendee_ids = [a["userId"] for a in event.get("attendees", [])]
        users = list(user_collection.find(
            {
                "userId": {"$in": attendee_ids},
                "push_tokens": {"$exists": True, "$not": {"$size": 0}},
            },
            {"push_tokens": 1, "settings.notifications_enabled": 1},
        ))
    else:
        users = get_users_with_push_tokens()

    messages = [
        {"to": token, "title": req.title, "body": req.body, "sound": "default"}
        for u in users
        if u.get("settings", {}).get("notifications_enabled", True)
        for token in u.get("push_tokens", [])
    ]
    send_push_notifications(messages)
    return {"sent": len(messages)}
