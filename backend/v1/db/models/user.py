from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserLocation(BaseModel):
    latitude: float
    longitude: float
    timestamp: Optional[datetime]
    accuracy: float  # Accuracy in meters


class PrivacySetting(str, Enum):
    NO_ONE          = 'NO_ONE'
    MEMBERS_ONLY    = 'MEMBERS_ONLY'
    MEMBERS_MUTUAL  = 'MEMBERS_MUTUAL'
    EVERYONE_MUTUAL = 'EVERYONE_MUTUAL'
    EVERYONE        = 'EVERYONE'


class UserSettings(BaseModel):
    show_location: PrivacySetting = Field(default=PrivacySetting.NO_ONE,
                                          example=PrivacySetting.EVERYONE)
    show_profile: PrivacySetting = Field(default=PrivacySetting.MEMBERS_ONLY,
                                         example=PrivacySetting.MEMBERS_ONLY)
    show_email: PrivacySetting = Field(default=PrivacySetting.NO_ONE, example=PrivacySetting.MEMBERS_ONLY)
    show_phone: PrivacySetting = Field(default=PrivacySetting.NO_ONE, example=PrivacySetting.MEMBERS_ONLY)
    
    location_update_interval_seconds: int = Field(default=60, example=60, description="Location update interval in seconds")
    events_refresh_interval_seconds: int = Field(default=60, example=60, description="Events refresh interval in seconds")
    
    background_location_updates: bool = Field(default=False, example=True, description="Allow location updates when app is in background")


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
