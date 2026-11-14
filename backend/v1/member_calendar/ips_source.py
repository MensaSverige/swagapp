"""Reads the member site calendar straight out of its MySQL database.

medlem.mensa.se runs IPS Community Suite, which keeps its calendar in a
`calendar_events` table. We reach it over an SSH tunnel and query it
directly rather than subscribing to the site's iCalendar feed, because the
table carries location, booking and category data the feed does not expose.

IPS is an implementation detail of this file. Everything downstream works in
terms of `MemberCalendarEvent`.
"""
from __future__ import annotations

import json
import logging
import re
from io import StringIO
from datetime import datetime, timezone
from typing import List, Optional

import paramiko
import pymysql
from sshtunnel import SSHTunnelForwarder

from v1.member_calendar.calendar_model import MemberCalendarEvent
from v1.env_constants import (
    MEDLEM_SSH_HOST,
    MEDLEM_SSH_PORT,
    MEDLEM_SSH_USER,
    MEDLEM_SSH_KEY,
    MEDLEM_SSH_PASSWORD,
    MEDLEM_DB_HOST,
    MEDLEM_DB_NAME,
    MEDLEM_DB_USER,
    MEDLEM_DB_PASS,
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
        e.event_lastupdated,
        e.event_calendar_id,
        c.cal_title_seo,
        m.name AS organizer_name,
        m.mensa_id AS organizer_mensa_id
    FROM calendar_events e
    LEFT JOIN calendar_calendars c ON c.cal_id = e.event_calendar_id
    LEFT JOIN core_members m ON m.member_id = e.event_member_id
    WHERE e.event_approved = 1
    ORDER BY e.event_start_date DESC
"""

EVENT_URL = "https://medlem.mensa.se/calendar/event/{event_id}/"


# Every private key format paramiko can read. Tried in turn because the PEM
# header alone does not say which one it is -- OpenSSH's own container holds
# ed25519, RSA and ECDSA keys under the same first line.
_KEY_TYPES = (paramiko.Ed25519Key, paramiko.RSAKey, paramiko.ECDSAKey)


def _private_key(material: str):
    """Parse an SSH private key held as TEXT, not as a file on disk.

    The secret vault hands out the key's contents, and a pod has nowhere to
    point a path at, so the key never touches the filesystem.

    A secret store or an env file routinely flattens a PEM into one line with
    literal backslash-n between the armour and the body; that is unparseable,
    and silently so, which is why it is repaired here rather than diagnosed in
    an incident. Returns None if the material is not a key at all.
    """
    if not material:
        return None
    text = material.replace("\\n", "\n").strip() + "\n"
    for key_type in _KEY_TYPES:
        try:
            return key_type.from_private_key(StringIO(text))
        except Exception:
            continue
    logger.error("Member site SSH key could not be parsed as any known key type")
    return None


def _ssh_tunnel() -> SSHTunnelForwarder:
    """Open an SSH tunnel to the member site."""
    kwargs = {
        "ssh_address_or_host": (MEDLEM_SSH_HOST, int(MEDLEM_SSH_PORT or 22)),
        "ssh_username": MEDLEM_SSH_USER,
        "remote_bind_address": (MEDLEM_DB_HOST or "127.0.0.1", 3306),
    }
    key = _private_key(MEDLEM_SSH_KEY)
    if key is not None:
        kwargs["ssh_pkey"] = key
    elif MEDLEM_SSH_PASSWORD:
        kwargs["ssh_password"] = MEDLEM_SSH_PASSWORD
    return SSHTunnelForwarder(**kwargs)


def _strip_html(html: str) -> str:
    """Reduce the stored HTML body to plain text."""
    text = re.sub(r"<[^>]+>", "", html)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    return re.sub(r"\s+", " ", text).strip()


def _unix_to_utc(value) -> Optional[datetime]:
    """Unix seconds (IPS stores UTC) to an aware datetime; 0/None/junk -> None."""
    try:
        seconds = int(value)
    except (TypeError, ValueError):
        return None
    if seconds <= 0:
        return None
    return datetime.fromtimestamp(seconds, tz=timezone.utc)


def _parse_location(raw) -> dict:
    """`event_location` is a JSON string or NULL; anything else means no location."""
    if not raw or not isinstance(raw, str):
        return {}
    try:
        data = json.loads(raw)
    except ValueError:
        return {}
    return data if isinstance(data, dict) else {}


def _coord(value) -> Optional[float]:
    """null, "" and 0 all mean "no coordinate"."""
    if value in (None, ""):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number or None


def _member_number(value) -> Optional[int]:
    """`mensa_id` is 0, not NULL, for a member without a membership number.

    Ten of the member site's 8799 members are in that position, and 0 is
    nobody -- it must not reach the app as a user id.
    """
    try:
        number = int(value)
    except (TypeError, ValueError):
        return None
    return number or None


def _text(value) -> Optional[str]:
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def clean_region(slug: Optional[str]) -> Optional[str]:
    """`lma-orebro-intern` -> `orebro`: drop the lf-/lma- prefix and -intern/-offentlig suffix."""
    if not slug:
        return None
    region = slug.strip().lower()
    for prefix in ("lf-", "lma-"):
        if region.startswith(prefix):
            region = region[len(prefix):]
            break
    for suffix in ("-intern", "-offentlig"):
        if region.endswith(suffix):
            region = region[: -len(suffix)]
            break
    return region or None


def row_to_event(row: dict) -> Optional[MemberCalendarEvent]:
    """Turn one joined `calendar_events` row into a MemberCalendarEvent.

    Returns None for a row we cannot place on a calendar; an event with no
    start date has nothing to show against.
    """
    if not row.get("event_start_date"):
        logger.warning("Skipping calendar event %s without a start date", row.get("event_id"))
        return None

    content = row.get("event_content")
    loc = _parse_location(row.get("event_location"))
    lines = loc.get("addressLines")
    if isinstance(lines, str):
        lines = [lines]
    address = ", ".join(str(l).strip() for l in (lines or []) if l and str(l).strip()) or None
    city = _text(loc.get("city"))
    slug = _text(row.get("cal_title_seo"))

    return MemberCalendarEvent(
        source_id=str(row["event_id"]),
        title=row.get("event_title") or "Untitled Event",
        description=_strip_html(content) if content else None,
        location=city or address,
        address=address,
        city=city,
        postal_code=_text(loc.get("postalCode")),
        country=_text(loc.get("country")),
        latitude=_coord(loc.get("lat")),
        longitude=_coord(loc.get("long")),
        region=clean_region(slug),
        region_slug=slug,
        region_id=row.get("event_calendar_id"),
        start=row["event_start_date"],
        end=row.get("event_end_date"),
        created=_unix_to_utc(row.get("event_saved")),
        last_modified=_unix_to_utc(row.get("event_lastupdated")),
        organizer=_text(row.get("organizer_name")),
        organizer_id=_member_number(row.get("organizer_mensa_id")),
        url=EVENT_URL.format(event_id=row["event_id"]),
    )


def fetch_member_calendar_events() -> List[MemberCalendarEvent]:
    """Fetch every approved calendar event from the member site.

    Returns an empty list on any connection failure: a calendar we cannot
    reach should leave the last successful sync in place, not break the
    scheduler.
    """
    if not all([MEDLEM_SSH_HOST, MEDLEM_SSH_USER, MEDLEM_DB_NAME,
                MEDLEM_DB_USER, MEDLEM_DB_PASS]):
        logger.warning("Member calendar database not fully configured, skipping sync")
        return []

    # Refuse before connecting rather than hand paramiko nothing and let it
    # fall through to whatever else it can find.
    if not MEDLEM_SSH_PASSWORD and _private_key(MEDLEM_SSH_KEY) is None:
        logger.warning("No usable member site SSH credential, skipping sync")
        return []

    events: List[MemberCalendarEvent] = []
    tunnel = _ssh_tunnel()
    try:
        tunnel.start()
        logger.info("SSH tunnel established on local port %s", tunnel.local_bind_port)

        conn = pymysql.connect(
            host="127.0.0.1",
            port=tunnel.local_bind_port,
            user=MEDLEM_DB_USER,
            password=MEDLEM_DB_PASS,
            database=MEDLEM_DB_NAME,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )
        try:
            with conn.cursor() as cursor:
                cursor.execute(EVENTS_QUERY)
                rows = cursor.fetchall()
                logger.info("Fetched %d rows from calendar_events", len(rows))
                events = [e for e in (row_to_event(r) for r in rows) if e is not None]
        finally:
            conn.close()
    except Exception as e:
        logger.error("Failed to fetch member calendar events: %s", e, exc_info=True)
    finally:
        tunnel.stop()

    return events
