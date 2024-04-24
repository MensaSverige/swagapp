from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserLocation(BaseModel):
    latitude: float
    longitude: float
    timestamp: Optional[datetime]
    accuracy: int  # Accuracy in meters


class ShowLocation(str, Enum):
    NO_ONE = 'NO_ONE'
    ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION = 'ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION'
    ALL_MEMBERS = 'ALL_MEMBERS'
    EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION = 'EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION'
    EVERYONE = 'EVERYONE'


class UserSettings(BaseModel):
    show_location: ShowLocation = Field(default=ShowLocation.NO_ONE,
                                        example=ShowLocation.EVERYONE)
    show_email: bool = Field(default=False, example=True)
    show_phone: bool = Field(default=False, example=True)


class ContactInfo(BaseModel):
    email: Optional[str] = Field(None, example="johndoe@example.com")
    phone: Optional[str] = Field(None, example="+1234567890")


class User(BaseModel):
    userId: int = Field(..., example=123)
    isMember: bool = Field(default=False, example=True)
    settings: UserSettings
    location: Optional[UserLocation] = Field(None,
                                             example={
                                                 "latitude": 37.7749,
                                                 "longitude": -122.4194,
                                                 "timestamp": "2021-01-01",
                                                 "accuracy": 10
                                             })
    contact_info: Optional[ContactInfo] = Field(None,
                                                example={
                                                    "email":
                                                    "johndoe@example.com",
                                                    "phone": "+1234567890"
                                                })
    age: Optional[int] = Field(None, example=30)
    slogan: Optional[str] = Field(None, example="Live and Let Live")
    avatar_url: Optional[str] = Field(None,
                                      example="https://example.com/avatar.jpg")
    firstName: Optional[str] = Field(None, example="John Doe")
    lastName: Optional[str] = Field(None, example="John Doe")


class UserUpdate(BaseModel):
    settings: UserSettings
    contact_info: Optional[ContactInfo] = Field(None,
                                                example={
                                                    "email":
                                                    "johndoe@example.com",
                                                    "phone": "+1234567890"
                                                })
    slogan: Optional[str] = Field(None, example="Live and Let Live")
