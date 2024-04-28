from datetime import datetime
from pydantic import BaseModel, Field
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


class ExtendedUserEvent(UserEvent):
    ownerName: str = Field(..., example="John Doe")
    hostNames: List[str] = Field([], example=["John Doe"])
    attendeeNames: List[str] = Field([], example=["John Doe"])
