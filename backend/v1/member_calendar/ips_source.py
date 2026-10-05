"""Reads the member site calendar straight out of its MySQL database.

medlem.mensa.se runs IPS Community Suite, which keeps its calendar in a
`calendar_calendar_events` table. We reach it over an SSH tunnel and query it
directly rather than subscribing to the site's iCalendar feed, because the
table carries location, booking and category data the feed does not expose.

IPS is an implementation detail of this file. Everything downstream works in
terms of `MemberCalendarEvent`.
"""
from __future__ import annotations

import logging
import re
from typing import List, Optional

import pymysql
from sshtunnel import SSHTunnelForwarder

from v1.member_calendar.calendar_model import MemberCalendarEvent
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

EVENTS_QUERY = """
    SELECT
        e.event_id,
        e.event_title,
        e.event_content,
        e.event_location,
        e.event_start_date,
        e.event_end_date,
        e.event_saved,
        e.event_last_update
    FROM calendar_calendar_events e
    WHERE e.event_approved = 1
    ORDER BY e.event_start_date DESC
"""

EVENT_URL = "https://medlem.mensa.se/calendar/event/{event_id}/"


def _ssh_tunnel() -> SSHTunnelForwarder:
    """Open an SSH tunnel to the member site."""
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


def _strip_html(html: str) -> str:
    """Reduce the stored HTML body to plain text."""
    text = re.sub(r"<[^>]+>", "", html)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    return re.sub(r"\s+", " ", text).strip()


def row_to_event(row: dict) -> Optional[MemberCalendarEvent]:
    """Turn one `calendar_calendar_events` row into a MemberCalendarEvent.

    Returns None for a row we cannot place on a calendar; an event with no
    start date has nothing to show against.
    """
    if not row.get("event_start_date"):
        logger.warning("Skipping calendar event %s without a start date", row.get("event_id"))
        return None

    content = row.get("event_content")
    return MemberCalendarEvent(
        source_id=str(row["event_id"]),
        title=row.get("event_title") or "Untitled Event",
        description=_strip_html(content) if content else None,
        location=row.get("event_location"),
        start=row["event_start_date"],
        end=row.get("event_end_date"),
        created=row.get("event_saved"),
        last_modified=row.get("event_last_update"),
        # IPS stores the creator as a member id, which we cannot resolve to a
        # name from here. Left unset until the sync learns to look it up.
        organizer=None,
        url=EVENT_URL.format(event_id=row["event_id"]),
    )


def fetch_member_calendar_events() -> List[MemberCalendarEvent]:
    """Fetch every approved calendar event from the member site.

    Returns an empty list on any connection failure: a calendar we cannot
    reach should leave the last successful sync in place, not break the
    scheduler.
    """
    if not all([IPS_SSH_HOST, IPS_SSH_USER, IPS_DB_NAME, IPS_DB_USER, IPS_DB_PASS]):
        logger.warning("Member calendar database not fully configured, skipping sync")
        return []

    events: List[MemberCalendarEvent] = []
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
                events = [e for e in (row_to_event(r) for r in rows) if e is not None]
        finally:
            conn.close()
    except Exception as e:
        logger.error("Failed to fetch member calendar events: %s", e, exc_info=True)
    finally:
        tunnel.stop()

    return events
