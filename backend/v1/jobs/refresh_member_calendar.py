"""Background job syncing the member site calendar into the unified events table."""
from __future__ import annotations

import logging

from v1.env_constants import IPS_SSH_HOST, IPS_DB_NAME
from v1.member_calendar.calendar_db import store_member_calendar_events


logger = logging.getLogger(__name__)


def refresh_member_calendar():
    """Fetch member calendar events and upsert them into `events`."""

    if not IPS_SSH_HOST or not IPS_DB_NAME:
        logger.warning(
            "Member calendar not configured (IPS_SSH_HOST/IPS_DB_NAME), skipping sync")
        return

    try:
        from v1.member_calendar.ips_source import fetch_member_calendar_events

        logger.info("Fetching member calendar events over SSH tunnel")
        calendar_events = fetch_member_calendar_events()
        if not calendar_events:
            logger.warning("No events fetched from the member calendar")
            return

        stored_count = store_member_calendar_events(calendar_events)
        logger.info(f"Stored/updated {stored_count} member calendar events")
    except Exception as e:
        logger.error(f"Member calendar sync failed: {e}", exc_info=True)
