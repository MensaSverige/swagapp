from pydantic import BaseModel, Field
from typing import List, Optional
from pydantic import BaseModel
from pydantic import BaseModel

class GeoLocation(BaseModel):
    formatted_address: Optional[str] = Field(None, example="1234 Main St, San Francisco, CA 94123")
    latitude: Optional[float] = Field(None, example=37.7749)
    longitude: Optional[float] = Field(None, example=-122.4194)
