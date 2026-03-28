"""Service for fetching calendar events directly from the IPS Community Suite MySQL database.

Connects via SSH tunnel to the remote IPS database and queries the calendar_events table.
This gives richer event data than the iCal feed (location, booking, categories, etc.).
"""
from __future__ import annotations
import logging
from typing import List, Optional
from datetime import datetime
from dataclasses import dataclass

import pymysql
from sshtunnel import SSHTunnelForwarder

from v1.ical_events.ical_model import ICalEvent
from v1.env_constants import (
    IPS_SSH_HOST,
    IPS_SSH_PORT,
    IPS_SSH_USER,
    IPS_SSH_PASSWORD,
    IPS_SSH_KEY_PATH,
    IPS_DB_HOST,
    IPS_DB_NAME,
    IPS_DB_USER,
    IPS_DB_PASS,
)


logger = logging.getLogger(__name__)


@dataclass
class IPSCalendarEvent:
    """Raw event data from the IPS calendar_events table."""
    event_id: int
    event_title: str
    event_content: Optional[str]
    event_location: Optional[str]
    event_start_date: Optional[datetime]
    event_end_date: Optional[datetime]
    event_recurring: Optional[int]
    event_approved: int
    event_saved: Optional[datetime]
    event_last_update: Optional[datetime]
    event_member_id: int
    event_calendar_id: int


EVENTS_QUERY = """
    SELECT
        e.event_id,
        e.event_title,
        e.event_content,
        e.event_location,
        e.event_start_date,
        e.event_end_date,
        e.event_recurring,
        e.event_approved,
        e.event_saved,
        e.event_last_update,
        e.event_member_id,
        e.event_calendar_id
    FROM calendar_calendar_events e
    WHERE e.event_approved = 1
    ORDER BY e.event_start_date DESC
"""


def _ssh_tunnel() -> SSHTunnelForwarder:
    """Create an SSH tunnel to the IPS server."""
    kwargs = {
        "ssh_address_or_host": (IPS_SSH_HOST, int(IPS_SSH_PORT or 22)),
        "ssh_username": IPS_SSH_USER,
        "remote_bind_address": (IPS_DB_HOST or "127.0.0.1", 3306),
    }
    if IPS_SSH_KEY_PATH:
        kwargs["ssh_pkey"] = IPS_SSH_KEY_PATH
    elif IPS_SSH_PASSWORD:
        kwargs["ssh_password"] = IPS_SSH_PASSWORD
    return SSHTunnelForwarder(**kwargs)


def fetch_ips_calendar_events() -> List[IPSCalendarEvent]:
    """Fetch all approved calendar events from the IPS MySQL database via SSH tunnel.

    Returns:
        List of IPSCalendarEvent dataclass instances.
    """
    if not all([IPS_SSH_HOST, IPS_SSH_USER, IPS_DB_NAME, IPS_DB_USER, IPS_DB_PASS]):
        logger.warning("IPS database connection not fully configured, skipping IPS calendar sync")
        return []

    events: List[IPSCalendarEvent] = []

    tunnel = _ssh_tunnel()
    try:
        tunnel.start()
        logger.info("SSH tunnel established on local port %s", tunnel.local_bind_port)

        conn = pymysql.connect(
            host="127.0.0.1",
            port=tunnel.local_bind_port,
            user=IPS_DB_USER,
            password=IPS_DB_PASS,
            database=IPS_DB_NAME,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )
        try:
            with conn.cursor() as cursor:
                cursor.execute(EVENTS_QUERY)
                rows = cursor.fetchall()
                logger.info("Fetched %d rows from calendar_calendar_events", len(rows))

                for row in rows:
                    events.append(IPSCalendarEvent(
                        event_id=row["event_id"],
                        event_title=row.get("event_title", ""),
                        event_content=row.get("event_content"),
                        event_location=row.get("event_location"),
                        event_start_date=row.get("event_start_date"),
                        event_end_date=row.get("event_end_date"),
                        event_recurring=row.get("event_recurring"),
                        event_approved=row.get("event_approved", 0),
                        event_saved=row.get("event_saved"),
                        event_last_update=row.get("event_last_update"),
                        event_member_id=row.get("event_member_id", 0),
                        event_calendar_id=row.get("event_calendar_id", 0),
                    ))
        finally:
            conn.close()
    except Exception as e:
        logger.error("Failed to fetch IPS calendar events: %s", e, exc_info=True)
    finally:
        tunnel.stop()

    return events


def map_ips_to_ical(ips_event: IPSCalendarEvent) -> Optional[ICalEvent]:
    """Map an IPS calendar event to the intermediate ICalEvent model.

    This keeps the existing mapping pipeline (ICalEvent -> unified Event) intact.
    """
    if not ips_event.event_start_date:
        logger.warning("Skipping IPS event %d without start date", ips_event.event_id)
        return None

    # Strip HTML tags from content for description
    description = _strip_html(ips_event.event_content) if ips_event.event_content else None

    return ICalEvent(
        uid=f"ips-event-{ips_event.event_id}@medlem.mensa.se",
        summary=ips_event.event_title or "Untitled Event",
        description=description,
        location=ips_event.event_location,
        start=ips_event.event_start_date,
        end=ips_event.event_end_date,
        created=ips_event.event_saved,
        last_modified=ips_event.event_last_update,
        organizer=None,
        url=f"https://medlem.mensa.se/calendar/event/{ips_event.event_id}/",
        status="CONFIRMED",
    )


def _strip_html(html: str) -> str:
    """Remove HTML tags from a string."""
    import re
    text = re.sub(r"<[^>]+>", "", html)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text
