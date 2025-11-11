from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from v1.shared.model_with_id import ModelWithId
from typing import List, Optional


class Attendee(BaseModel):
    userId: int = Field(..., example=123)


class Host(BaseModel):
    userId: int = Field(..., example=123)


class Report(BaseModel):
    userId: int = Field(..., example=123)
    text: str = Field(..., example="Report Text")


class Location(BaseModel):
    description: Optional[str] = Field(None, example="Location Description")
    address: Optional[str] = Field(None, example="1234 Main St, San Francisco, CA 94123")
    marker: Optional[str] = Field(None, example="🕑")
    latitude: Optional[float] = Field(None, example=37.7749)
    longitude: Optional[float] = Field(None, example=-122.4194)


class UserEvent(ModelWithId):
    userId: int = Field(..., example=123)
    hosts: Optional[List[Host]] = Field([], example=[{"userId": 123}])
    suggested_hosts: List[Host] = Field([], example=[{"userId": 123}])
    name: str = Field(..., example="Event Name")
    location: Optional[Location] = Field(None,
                                         example={
                                             "latitude": 37.7749,
                                             "longitude": -122.4194
                                         })
    start: datetime = Field(..., example="2021-01-01T00:00:00")
    end: Optional[datetime] = Field(None, example="2021-01-01T00:00:00")
    description: Optional[str] = Field(None, example="Event Description")
    reports: List[Report] = Field([],
                                  example=[{
                                      "user": "John Doe",
                                      "text": "Report Text"
                                  }])
    attendees: List[Attendee] = Field([], example=[{"userId": 123}])
    maxAttendees: Optional[int] = Field(None, example=10)

    @field_validator('start', 'end', mode='before')
    @classmethod
    def parse_datetime(cls, value):
        """Parse datetime strings into datetime objects, handling ISO format and timezone conversion"""
        if value is None:
            return value
        
        if isinstance(value, str):
            # Try to parse ISO format datetime strings
            try:
                # Parse ISO format and handle timezone
                if value.endswith('Z'):
                    dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                else:
                    dt = datetime.fromisoformat(value)
                
                # If timezone-aware, convert to naive datetime in application timezone
                if dt.tzinfo is not None:
                    from v1.utilities import get_current_time_zone
                    return dt.astimezone(get_current_time_zone()).replace(tzinfo=None)
                else:
                    return dt
            except ValueError:
                # Fallback to standard ISO parsing
                return datetime.fromisoformat(value)
        
        return value


class ExtendedUserEvent(UserEvent):
    ownerName: str = Field(..., example="John Doe")
    hostNames: List[str] = Field([], example=["John Doe"])
    attendeeNames: List[str] = Field([], example=["John Doe"])
