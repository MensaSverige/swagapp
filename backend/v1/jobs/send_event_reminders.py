import logging
from datetime import datetime, timedelta, timezone

from v1.db.mongo import user_collection, user_event_collection
from v1.notifications.push_service import send_push_notifications

REMINDER_WINDOWS = [
    {"hours": 24, "label": "imorgon"},
    {"hours": 1, "label": "om en timme"},
]
TOLERANCE = timedelta(minutes=7, seconds=30)


def send_event_reminders():
    # MongoDB stores datetimes as naive UTC; match that here
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    messages = []

    for window in REMINDER_WINDOWS:
        target = now + timedelta(hours=window["hours"])
        events = list(user_event_collection.find({
            "start": {"$gte": target - TOLERANCE, "$lte": target + TOLERANCE}
        }))

        for event in events:
            attendee_ids = [a["userId"] for a in event.get("attendees", [])]
            if not attendee_ids:
                continue

            users = user_collection.find(
                {
                    "userId": {"$in": attendee_ids},
                    "push_tokens": {"$exists": True, "$not": {"$size": 0}},
                    "settings.notifications_enabled": {"$ne": False},
                },
                {"push_tokens": 1},
            )

            for user in users:
                for token in user.get("push_tokens", []):
                    messages.append({
                        "to": token,
                        "title": event["name"],
                        "body": f"Påminnelse: evenemanget börjar {window['label']}",
                        "sound": "default",
                        "data": {"eventId": f"usr{event['_id']}"},
                    })

    if messages:
        logging.info("Sending %d event reminder notifications", len(messages))
        send_push_notifications(messages)
