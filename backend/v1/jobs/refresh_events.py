from v1.db.external_events import (
    clean_external_events,
    get_stored_external_event_details,
)
from v1.external.event_api import (
    get_external_root,
    get_external_event_details,
    get_booked_external_events,
)
from v1.db.external_bookings import upsert_user_bookings
from v1.db.database import get_session
from v1.db.tables import TokenStorageTable
import logging

def refresh_external_events():
    root = get_external_root()
    if not root or not root.restUrl or root.restUrl == "" or not root.dates:
        logging.error("Failed to fetch external root or missing data.")
        return

    all_external_events = []
    for date in root.dates:
        date_external_events = get_external_event_details(root.restUrl, date)
        if date_external_events:
            all_external_events.extend(date_external_events)

    # Remove external events that are not in the list of all_external_events
    clean_external_events(keeping=all_external_events)

    # Triple checking. Check that each of all_external_events is still in the database,
    # using get_stored_external_event_details
    for event in all_external_events:
        event_id = event.eventId
        # Check if the event is in the database
        stored_event = get_stored_external_event_details(event_ids=[event_id])
        if not stored_event:
            logging.error(f"Event {event_id} not found in the database after cleaning.")
            continue

    # Refresh per-user booking cache after events are updated
    refresh_external_bookings()


def refresh_external_bookings():
    """Refresh the external_event_bookings collection for all users with stored tokens."""
    try:
        with get_session() as session:
            user_ids = [row.userId for row in session.query(TokenStorageTable.userId).all()]
    except Exception as e:
        logging.error(f"[refresh_external_bookings] Failed to fetch token holders: {e}")
        return

    logging.info(f"[refresh_external_bookings] Refreshing bookings for {len(user_ids)} users")
    for user_id in user_ids:
        try:
            booked = get_booked_external_events(user_id)
            event_ids = [e.eventId for e in booked]
            upsert_user_bookings(userId=user_id, event_ids=event_ids)
        except Exception as e:
            logging.warning(f"[refresh_external_bookings] Skipping userId={user_id}: {e}")
