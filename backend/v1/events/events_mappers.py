from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, Set
import logging

from v1.db.models.external_events import ExternalEventDetails
from v1.user_events.user_events_model import ExtendedUserEvent, UserEvent, Location, Host, Attendee
from v1.events.events_model import Event, EventAttendee, EventHost, ShowAttendees, Tag
from v1.utilities import get_current_time, convert_to_tz_aware, get_current_time_zone


ISO_VARIANTS = [
    "%Y-%m-%dT%H:%M:%S", 
    "%Y-%m-%d %H:%M:%S", 
    "%Y-%m-%dT%H:%M:%S.%f", 
    "%Y-%m-%d %H:%M:%S.%f",
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y-%m-%dT%H:%M:%S.%fZ"
]

def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    """Parse a datetime string into a datetime object using the application's timezone utilities."""
    if not value:
        return None
    
    # Try parsing with various formats
    for fmt in ISO_VARIANTS:
        try:
            dt = datetime.strptime(value, fmt)
            # If no timezone info, assume it's in the application's timezone
            if dt.tzinfo is None:
                # Convert to timezone-aware using your utility, then to naive for database storage
                tz_aware = dt.replace(tzinfo=get_current_time_zone())
                return tz_aware.astimezone(get_current_time_zone()).replace(tzinfo=None)
            else:
                # Convert timezone-aware datetime to application timezone, then naive
                return dt.astimezone(get_current_time_zone()).replace(tzinfo=None)
        except ValueError:
            continue
    
    # Try using fromisoformat for more flexible parsing
    try:
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        # Convert to application timezone if it has timezone info
        if dt.tzinfo is not None:
            return dt.astimezone(get_current_time_zone()).replace(tzinfo=None)
        else:
            # Assume application timezone if no timezone info
            tz_aware = dt.replace(tzinfo=get_current_time_zone())
            return tz_aware.replace(tzinfo=None)
    except Exception:
        logging.warning(f"Failed to parse datetime string: {value}")
        return None


def _utc_now() -> datetime:
    """Get current time using the application's timezone utilities."""
    return get_current_time().replace(tzinfo=None)


def map_external_event(details: ExternalEventDetails, current_user_id: int, booked_ids: Set[int]) -> Optional[Event]:
    # eventDate already combined in event_api.get_external_event_details
    if not details.eventDate:
        logging.warning(f"External event missing eventDate: {details.eventId}")
        return None
    try:
        start_dt = details.eventDate
        end_dt = None
        if details.endTime:
            try:
                end_time_obj = datetime.strptime(details.endTime, "%H:%M").time()
                end_dt = datetime.combine(start_dt.date(), end_time_obj)
            except Exception:
                pass

        booking_start = _parse_dt(details.dateBookingStart)
        booking_end = _parse_dt(details.dateBookingEnd) or start_dt

        attending = details.eventId in booked_ids

        # Bookable logic
        now = _utc_now()
        within_window = (not booking_start or booking_start <= now) and (not booking_end or now <= booking_end)
        capacity_ok = True
        if details.isLimited:
            capacity_ok = details.stock > 0
        bookable = within_window and capacity_ok and start_dt >= now

        image_url = details.imageUrl300 or details.imageUrl150

        # Convert adminsRaw (strings) to int user IDs where possible
        admin_ids = []
        if details.admins:
            for a in details.admins:
                try:
                    admin_ids.append(int(a))
                except Exception:
                    # skip non-numeric admin identifiers
                    continue

        # Construct hosts array from speaker if possible
        hosts = []
        if details.speaker:
            hosts.append(EventHost(userId=0, fullName=details.speaker))

        # Create tags from categories
        tags = []
        if details.categories:
            for category in details.categories:
                tags.append(Tag(
                    code=category.code,
                    text=category.text,
                    colorText=category.colorText,
                    colorBackground=category.colorBackground,
                ))

        event = Event(
            id=f"ext{details.eventId}",
            parentEvent=None,
            admin=admin_ids,
            hosts=hosts,
            name=details.titel or details.description.split("\n")[0][:60],
            tags=tags,
            locationDescription=details.locationInfo,
            address=details.location,
            locationMarker=None,
            latitude=None,
            longitude=None,
            start=start_dt,
            end=end_dt,
            cancelled=None,
            imageUrl=image_url,
            description=details.description,
            bookingStart=booking_start,
            bookingEnd=booking_end,
            showAttendees=ShowAttendees.none,
            attendees=[],
            queue=[],
            maxAttendees=(details.booked + details.stock) if details.isLimited else None,
            price=float(details.price) if not details.isFree else 0.0,
            official=True,
            attending=attending,
            bookable=bookable,
            extras={
                "speaker": details.speaker,
                "categories": [c.model_dump() for c in details.categories] if details.categories else [],
                "eventUrl": details.eventUrl,
                "adminsRaw": details.admins or [],
                "mapUrl": details.mapUrl,
                "showBooked": details.showBooked,
                "bookedCount": details.booked,
            }
        )
        return event
    except Exception as e:
        logging.error(f"Failed to map external event {details.eventId}: {e}")
        return None


def map_user_event(ue: ExtendedUserEvent, current_user_id: int) -> Event:
    now = _utc_now()
    attending = any(a.userId == current_user_id for a in ue.attendees)
    max_att = ue.maxAttendees
    capacity_ok = True
    if max_att is not None:
        capacity_ok = len(ue.attendees) < max_att
    bookable = capacity_ok and not attending and ue.start >= now

    return Event(
        id=f"usr{ue.id}",
        parentEvent=None,
        admin=[ue.userId],
        hosts=[EventHost(userId=h.userId, fullName="") for h in (ue.hosts or [])],
        name=ue.name,
        tags=[],
        locationDescription=ue.location.description if ue.location else None,
        address=ue.location.address if ue.location else None,
        locationMarker=ue.location.marker if ue.location else None,
        latitude=ue.location.latitude if ue.location else None,
        longitude=ue.location.longitude if ue.location else None,
        start=ue.start,
        end=ue.end,
        cancelled=None,
        imageUrl=None,
        description=ue.description,
        bookingStart=None,
        bookingEnd=ue.start,
        showAttendees=ShowAttendees.all,
        attendees=[EventAttendee(userId=a.userId) for a in ue.attendees],
        queue=[],
        maxAttendees=max_att,
        price=0.0,
        official=False,
        attending=attending,
        bookable=bookable,
        extras={
            "ownerName": getattr(ue, "ownerName", None),
            "hostNames": getattr(ue, "hostNames", []),
            "attendeeNames": getattr(ue, "attendeeNames", []),
            "reportsCount": len(ue.reports) if getattr(ue, "reports", None) else 0,
        }
    )


# TEMPORARY reverse mapping until unified events are stored natively
# Once unified storage exists, this proxy and reverse mapping can be removed,
# and the user_events endpoints can be deprecated.
def map_event_to_user_event(event: Event, owner_id: int, existing: UserEvent | None = None) -> UserEvent:
    location = None
    if any([
        event.locationDescription,
        event.address,
        event.locationMarker,
        event.latitude is not None,
        event.longitude is not None,
    ]):
        location = Location(
            description=event.locationDescription,
            address=event.address,
            marker=event.locationMarker,
            latitude=event.latitude,
            longitude=event.longitude,
        )

    ue = UserEvent(
        userId=owner_id,
        hosts=[Host(userId=h.userId) for h in (event.hosts or [])],
        suggested_hosts=[],
        name=event.name,
        location=location,
        start=event.start,
        end=event.end,
        description=event.description,
        reports=(existing.reports if existing else []),
        attendees=[Attendee(userId=a.userId) for a in (existing.attendees if existing else [])],
        maxAttendees=event.maxAttendees,
    )
    return ue
