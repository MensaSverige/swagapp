"""Background job to refresh calendar events from IPS MySQL database via SSH tunnel."""
from __future__ import annotations
import logging
from v1.ical_events.ical_db import store_ical_events
from v1.env_constants import IPS_SSH_HOST, IPS_DB_NAME


logger = logging.getLogger(__name__)


def refresh_ical_events():
    """Fetch and store calendar events in the unified events collection."""

    if not IPS_SSH_HOST or not IPS_DB_NAME:
        logger.warning("IPS database not configured (IPS_SSH_HOST/IPS_DB_NAME), skipping calendar sync")
        return

    try:
        from v1.ical_events.ips_calendar_service import fetch_ips_calendar_events, map_ips_to_ical

        logger.info("Fetching calendar events from IPS database via SSH tunnel")
        ips_events = fetch_ips_calendar_events()
        if not ips_events:
            logger.warning("No events fetched from IPS database")
            return

        ical_events = []
        for ips_event in ips_events:
            mapped = map_ips_to_ical(ips_event)
            if mapped:
                ical_events.append(mapped)

        logger.info(f"Mapped {len(ical_events)} IPS events")
        stored_count = store_ical_events(ical_events)
        logger.info(f"Stored/updated {stored_count} IPS calendar events in unified collection")
    except Exception as e:
        logger.error(f"IPS database sync failed: {e}", exc_info=True)
