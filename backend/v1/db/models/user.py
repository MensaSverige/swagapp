from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class UserLocation(BaseModel):
    latitude: float
    longitude: float
    timestamp: date
    accuracy: float  # Accuracy in meters

class ShowLocation(str, Enum):
    no_one = 'no_one'
    only_members_who_share_their_own_location = 'only_members_who_share_their_own_location'
    only_members = 'only_members'
    everyone_who_share_their_own_location = 'everyone_who_share_their_own_location'
    everyone = 'everyone'

    def dict(self):
        return self.value
    
class UserSettings(BaseModel):
    show_location: ShowLocation = Field(default=ShowLocation.no_one, example=ShowLocation.everyone)
    show_contact_info: bool = Field(default=False, example=True)

    def dict(self):
        return {
            "show_location": self.show_location.value,
            "show_contact_info": self.show_contact_info
        }

class ContactInfo(BaseModel):
    email: Optional[str] = Field(None, example="johndoe@example.com")
    phone: Optional[str] = Field(None, example="+1234567890")

    def dict(self):
        return {
            "email": self.email,
            "phone": self.phone
        }

class User(BaseModel):
    userId: int = Field(..., example=123)
    isMember: bool = Field(default=False, example=True)
    settings: UserSettings
    location: Optional[UserLocation] = Field(None, example={"latitude": 37.7749, "longitude": -122.4194, "timestamp": "2021-01-01", "accuracy": 10}) 
    contact_info: Optional[ContactInfo] = Field(None, example={"email": "johndoe@example.com", "phone": "+1234567890"})
    age: Optional[int] = Field(None, example=30)
    slogan: Optional[str] = Field(None, example="Live and Let Live")
    avatar_url: Optional[str] = Field(None, example="https://example.com/avatar.jpg")
    firstName: Optional[str] = Field(None, example="John Doe")
    lastName: Optional[str] = Field(None, example="John Doe")

    def dict(self):
        return {
            "userId": self.userId,
            "isMember": self.isMember,
            "settings": self.settings.dict(),
            "location": self.location.dict() if self.location else None,
            "contact_info": self.contact_info.dict() if self.contact_info else None,
            "age": self.age,
            "slogan": self.slogan,
            "avatar_url": self.avatar_url,
            "firstName": self.firstName,
            "lastName": self.lastName
        }
