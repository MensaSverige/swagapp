from pydantic import BaseModel
from datetime import date, datetime, time
from typing import List, Optional
from pydantic import BaseModel

class Category(BaseModel):
    code: str
    text: str
    colorText: str
    colorBackground: str

class ExternalRoot(BaseModel):
    version: int
    loginUrl: str
    restUrl: str
    siteUrl: str
    dates: List[str]
    header1: str
    header2: str
    city: str
    streetAddress: str
    mapUrl: str

class ExternalEventDetails(BaseModel):
    eventId: int
    eventDate: Optional[datetime] = None
    startTime: str
    endTime: str
    titel: Optional[str] = None
    description: str
    speaker: str
    location: str
    locationInfo: Optional[str] = None
    mapUrl: Optional[str] = None
    admins: Optional[List[str]] = None
    isFree: bool
    price: int
    isLimited: bool
    stock: int
    showBooked: bool
    booked: int
    dateBookingStart: Optional[str] = None
    dateBookingEnd: Optional[str] = None
    categories: Optional[List[Category]] = None
    imageUrl150: Optional[str] = None
    imageUrl300: Optional[str] = None
    eventUrl: str

class ExternalEvent(BaseModel):
    eventId: int
    date: date
    time: time

class ExternalEventBooking(BaseModel):
    userId: int
    eventId: int

class ExternalAttendee(BaseModel):
    """A person on the booking site's list of those registered to the riksträff."""
    memberId: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    city: Optional[str] = None
    registered: Optional[str] = None


class ExternalAttendeeList(BaseModel):
    """The booking site's `attendees` answer. `count` includes people not listed."""
    status: Optional[str] = None
    count: int = 0
    attendees: List[ExternalAttendee] = []
