from __future__ import annotations
from datetime import datetime
from typing import Optional, Set
import logging

from v1.db.models.external_events import ExternalEventDetails
from v1.user_events.user_events_model import ExtendedUserEvent
from v1.events.events_model import Event, EventAttendee, EventHost, ShowAttendees


ISO_VARIANTS = ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%d %H:%M:%S.%f"]

def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    for fmt in ISO_VARIANTS:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(value)
    except Exception:
        logging.warning(f"Failed to parse datetime string: {value}")
        return None


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
        now = datetime.utcnow()
        within_window = (not booking_start or booking_start <= now) and (not booking_end or now <= booking_end)
        capacity_ok = True
        if details.isLimited:
            capacity_ok = details.booked < details.stock
        bookable = within_window and capacity_ok and not attending and start_dt >= now

        image_url = details.imageUrl300 or details.imageUrl150

        event = Event(
            id=f"ext:{details.eventId}",
            parentEvent=None,
            admin=[],  # admins are strings; keep raw in extras
            hosts=[],
            name=details.titel or details.description.split("\n")[0][:60],
            tags=[],
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
            maxAttendees=details.stock if details.isLimited else None,
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
    now = datetime.utcnow()
    attending = any(a.userId == current_user_id for a in ue.attendees)
    max_att = ue.maxAttendees
    capacity_ok = True
    if max_att is not None:
        capacity_ok = len(ue.attendees) < max_att
    bookable = capacity_ok and not attending and ue.start >= now

    return Event(
        id=f"usr:{ue.id}",
        parentEvent=None,
        admin=[ue.userId],
        hosts=[EventHost(userId=h.userId) for h in (ue.hosts or [])],
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
