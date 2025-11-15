from v1.db.external_events import (
    clean_external_events,
    get_stored_external_event_details,
)
from v1.external.event_api import get_external_root, get_external_event_details
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
