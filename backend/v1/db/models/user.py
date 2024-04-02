from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class User(BaseModel):
    userId: int = Field(..., example=123)
    isMember: bool = Field(default=False, example=True)
    show_location: bool = Field(default=False, example=True)
    show_contact_info: bool = Field(default=False, example=True)
    age: Optional[int] = Field(None, example=30)
    slogan: Optional[str] = Field(None, example="Live and Let Live")
    avatar_url: Optional[str] = Field(None, example="https://example.com/avatar.jpg")
    firstName: Optional[str] = Field(None, example="John Doe")
    lastName: Optional[str] = Field(None, example="John Doe")
    email: Optional[str] = Field(None, example="johndoe@example.com")
    phone: Optional[str] = Field(None, example="+1234567890")
