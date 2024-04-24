from pydantic import BaseModel
from datetime import date, datetime, time
from typing import List, Optional
from pydantic import BaseModel

class Category(BaseModel):
    code: str
    text: str
    colorText: str
    colorBackground: str

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