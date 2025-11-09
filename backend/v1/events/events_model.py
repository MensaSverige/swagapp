from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, Field


class ShowAttendees(str, Enum):
	none = "none"
	all = "all"
	toAttending = "toAttending"


class EventLocation(BaseModel):
	description: Optional[str] = None
	address: Optional[str] = None
	marker: Optional[str] = None
	latitude: Optional[float] = None
	longitude: Optional[float] = None
	mapUrl: Optional[str] = None


class EventAttendee(BaseModel):
	userId: int


class EventHost(BaseModel):
	userId: int


class Event(BaseModel):
	"""Unified Event model representing both official (external) and user-created events.

	Fields mostly follow the sketch in notes.md. Additional convenience & source-specific fields are stored under `extras`.
	"""
	id: str = Field(..., description="Globally unique event id, prefixed with source (ext: / usr:)")
	parentEvent: Optional[str] = Field(None, description="Optional parent event id")
	admin: List[int] = Field(default_factory=list, description="User IDs with admin rights (owner for user events)")
	hosts: List[EventHost] = Field(default_factory=list)
	name: str
	tags: List[int] = Field(default_factory=list)
	locationDescription: Optional[str] = None
	address: Optional[str] = None
	locationMarker: Optional[str] = None
	latitude: Optional[float] = None
	longitude: Optional[float] = None
	start: datetime
	end: Optional[datetime] = None
	cancelled: Optional[datetime] = None
	imageUrl: Optional[str] = None
	description: Optional[str] = None
	bookingStart: Optional[datetime] = None
	bookingEnd: Optional[datetime] = None
	showAttendees: ShowAttendees = ShowAttendees.none
	attendees: List[EventAttendee] = Field(default_factory=list)
	queue: List[EventAttendee] = Field(default_factory=list)
	maxAttendees: Optional[int] = None
	price: float = 0.0
	official: bool = Field(..., description="True for external official events, false for user events")
	attending: bool = Field(False, description="Current user is attending/booked")
	bookable: bool = Field(False, description="Event can still be booked / joined by current user")
	extras: dict[str, Any] = Field(default_factory=dict, description="Source specific raw data")

	class Config:
		json_schema_extra = {
			"example": {
				"id": "ext:12345",
				"name": "Opening Ceremony",
				"official": True,
				"start": "2025-11-10T09:00:00Z",
				"end": "2025-11-10T10:00:00Z",
				"attending": True,
				"bookable": False,
			}
		}

