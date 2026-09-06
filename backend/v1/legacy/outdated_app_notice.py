from typing import List
from fastapi import APIRouter, Depends
from v1.db.models.user import User
from v1.request_filter import require_member

legacy_notice_v1 = APIRouter(prefix="/v1")

# Deliberately a plain literal, not a model instance.
#
# The real /user_events endpoints were removed; app versions predating the
# unified /v1/events still poll this one, and this notice is the only way to
# reach them. It used to be constructed as an ExtendedUserEvent, which meant
# every later change to that model could break it — and did. The model
# required `name` and `start` while the notice passed `title` and `date`, so
# this endpoint returned 500 instead of the notice from the day it was added.
#
# Those clients are frozen and will never be rebuilt, so the payload is frozen
# too. Nothing here should be derived from a model that is still evolving, and
# there is no response_model for the same reason.
_STORE_LINKS = (
    '\n\n<a href="https://play.google.com/store/apps/details?id=se.mensasverige">'
    "Android - Google Play</a>"
    '\n\n<a href="https://apps.apple.com/se/app/mensa-sverige/id6755419896">'
    "iOS - App Store</a>"
)

_OUTDATED_APP_NOTICE = [
    {
        "id": "outdated_app_notice",
        "userId": 0,
        "name": "Uppdatera appen",
        "description": (
            "Den här versionen av appen är utdaterad. Vänligen uppdatera till "
            "den senaste versionen för att fortsätta använda alla funktioner."
            + _STORE_LINKS
        ),
        # Far future: an old client filtering to upcoming events would drop a
        # notice dated in the past, which is what the previous 2025 date did.
        "start": "2099-01-01T00:00:00Z",
        "end": None,
        "location": None,
        "hosts": [],
        "suggested_hosts": [],
        "attendees": [],
        "reports": [],
        "maxAttendees": None,
        "ownerName": "System",
        "hostNames": [],
        "attendeeNames": [],
    }
]


@legacy_notice_v1.get("/user_events")
async def outdated_app_notice(current_user: User = Depends(require_member)):
    return _OUTDATED_APP_NOTICE
