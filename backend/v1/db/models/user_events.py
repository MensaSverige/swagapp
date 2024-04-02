from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional

class Report(BaseModel):
    user: Optional[str] = None
    text: str

class Location(BaseModel):
    description: Optional[str] = None
    marker: Optional[str] = None
    latitude: float
    longitude: float

class Event(BaseModel):
    id: str
    owner: str
    name: str
    location: Location
    start: datetime
    end: Optional[datetime] = None
    description: Optional[str] = None
    reports: List[Report] = []
