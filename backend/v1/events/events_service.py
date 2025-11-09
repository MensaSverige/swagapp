from __future__ import annotations
from typing import List, Optional
from datetime import datetime
import logging

from v1.events.events_model import Event
from v1.events.events_mappers import map_external_event, map_user_event
from v1.db.external_events import get_stored_external_event_details, get_all_stored_external_event_details
from v1.external.event_api import get_booked_external_events
from v1.user_events.user_events_db import get_safe_future_user_events, get_safe_user_events_since


def list_unified_events(
    current_user_id: int,
    attending: Optional[bool] = None,
    bookable: Optional[bool] = None,
    official: Optional[bool] = None,
) -> List[Event]:
    """Fetch, map, merge and filter events from both sources.

    Filters follow semantics: if param is None -> include both states; else match exact state.
    """
    # External events
    try:
        booked_external = get_booked_external_events(current_user_id)
        booked_ids = {e.eventId for e in booked_external}
    except Exception as e:
        logging.error(f"Failed to fetch booked external events: {e}")
        booked_ids = set()

    try:
        # Now fetch ALL external events (not just booked/admin)
        external_events_details = get_all_stored_external_event_details()
    except Exception as e:
        logging.error(f"Failed to fetch all external events: {e}")
        external_events_details = []

    external_events: List[Event] = []
    for d in external_events_details:
        mapped = map_external_event(d, current_user_id, booked_ids)
        if mapped:
            external_events.append(mapped)

    # User events (already filtered to future via db function)
    try:
        # Include events starting from one month back
        one_month_back = datetime.utcnow() - datetime.timedelta(days=30)
        user_events = get_safe_user_events_since(one_month_back)
    except Exception as e:
        logging.error(f"Failed to fetch user events since range: {e}")
        user_events = []
    user_events_mapped = [map_user_event(u, current_user_id) for u in user_events]

    merged = external_events + user_events_mapped

    # Do not filter to future only; keep all external events and user events from one month back.

    def passes(flag_val: Optional[bool], actual: bool) -> bool:
        return flag_val is None or flag_val == actual

    filtered = [
        e for e in merged
        if passes(attending, e.attending) and passes(bookable, e.bookable)
        and passes(official, e.official)
    ]

    filtered.sort(key=lambda e: (e.start, e.name.lower()))
    return filtered
