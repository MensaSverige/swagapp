from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MemberCalendarEvent(BaseModel):
    """One event from the Mensa member site calendar.

    This is the single model between the source database and the unified
    `Event`. An earlier draft of this feature read an iCalendar subscription
    feed and carried an `ICalEvent` in this position; that approach was
    dropped for a direct database connection, which returns more (location,
    booking and category data the feed did not expose). The iCal-shaped
    intermediate is gone with it -- see `ips_source.py` for the actual source.
    """

    source_id: str = Field(..., description="Event id in the source system")
    title: str = Field(..., description="Event title")
    description: Optional[str] = Field(None, description="Event description, HTML as the member site stores it")
    location: Optional[str] = Field(None, description="Free-text location")
    address: Optional[str] = Field(None, description="Street address lines, comma-joined")
    city: Optional[str] = Field(None, description="City")
    postal_code: Optional[str] = Field(None, description="Postal code")
    country: Optional[str] = Field(None, description="Country code")
    latitude: Optional[float] = Field(None, description="Latitude, if the source has one")
    longitude: Optional[float] = Field(None, description="Longitude, if the source has one")
    region: Optional[str] = Field(None, description="Cleaned Mensa region name")
    region_slug: Optional[str] = Field(None, description="Raw calendar slug (cal_title_seo)")
    region_id: Optional[int] = Field(None, description="Source calendar id")
    start: datetime = Field(..., description="Event start")
    end: Optional[datetime] = Field(None, description="Event end")
    created: Optional[datetime] = Field(None, description="When the source created the event")
    last_modified: Optional[datetime] = Field(None, description="When the source last changed it")
    organizer: Optional[str] = Field(None, description="Organizer name, if the source names one")
    organizer_id: Optional[int] = Field(
        None, description="Organizer's Mensa membership number, if the source has one")
    url: Optional[str] = Field(None, description="Link to the event on the member site")

    class Config:
        json_schema_extra = {
            "example": {
                "source_id": "12345",
                "title": "Manadsmote",
                "description": "Regular monthly member meeting",
                "location": "Stockholm",
                "start": "2026-02-15T14:00:00",
                "end": "2026-02-15T16:00:00",
                "url": "https://medlem.mensa.se/calendar/event/12345/",
            }
        }
