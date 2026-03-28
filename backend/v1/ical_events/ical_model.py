from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class ICalEvent(BaseModel):
    """Model representing a parsed iCalendar event before mapping to unified Event model."""
    
    uid: str = Field(..., description="Unique identifier from iCalendar UID field")
    summary: str = Field(..., description="Event title/summary")
    description: Optional[str] = Field(None, description="Event description")
    location: Optional[str] = Field(None, description="Event location")
    start: datetime = Field(..., description="Event start datetime")
    end: Optional[datetime] = Field(None, description="Event end datetime")
    created: Optional[datetime] = Field(None, description="Event creation datetime")
    last_modified: Optional[datetime] = Field(None, description="Last modification datetime")
    organizer: Optional[str] = Field(None, description="Event organizer")
    url: Optional[str] = Field(None, description="Event URL")
    status: Optional[str] = Field(None, description="Event status (CONFIRMED, TENTATIVE, CANCELLED)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "uid": "event-12345@medlem.mensa.se",
                "summary": "Monthly Meeting",
                "description": "Regular monthly member meeting",
                "location": "Stockholm Office",
                "start": "2026-02-15T14:00:00",
                "end": "2026-02-15T16:00:00",
                "status": "CONFIRMED"
            }
        }
