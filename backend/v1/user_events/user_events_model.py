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
        """Parse datetime strings into timezone-aware datetime objects.

        Offsets are preserved. Values arriving without one are Swedish local
        wall-clock readings and are localized as such. (This used to strip
        tzinfo instead, because MongoDB could not store an offset; PostgreSQL
        stores it natively, so the values stay aware from here on.)
        """
        from v1.utilities import ensure_aware

        if value is None:
            return value

        if isinstance(value, str):
            try:
                if value.endswith('Z'):
                    dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                else:
                    dt = datetime.fromisoformat(value)
            except ValueError:
                return value  # let pydantic report the parse failure
            return ensure_aware(dt)

        if isinstance(value, datetime):
            return ensure_aware(value)

        return value


class ExtendedUserEvent(UserEvent):
    ownerName: str = Field(..., example="John Doe")
    hostNames: List[str] = Field([], example=["John Doe"])
    attendeeNames: List[str] = Field([], example=["John Doe"])
