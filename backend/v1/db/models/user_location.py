from pydantic import BaseModel, Field
from typing import Optional

class UserLocation(BaseModel):
    latitude: float
    longitude: float
    timestamp: str