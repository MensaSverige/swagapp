"""SQLAlchemy table definitions for all database models."""

from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime, Text, ForeignKey, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from v1.db.database import Base


# ── User ──────────────────────────────────────────────────────────────────────

class UserTable(Base):
    __tablename__ = "users"

    userId = Column(Integer, primary_key=True)
    isMember = Column(Boolean, default=False, nullable=False)

    # Settings (flattened from UserSettings)
    show_location = Column(String, default="NO_ONE", nullable=False)
    show_email = Column(Boolean, default=False, nullable=False)
    show_phone = Column(Boolean, default=False, nullable=False)
    location_update_interval_seconds = Column(Integer, default=60, nullable=False)
    events_refresh_interval_seconds = Column(Integer, default=60, nullable=False)
    background_location_updates = Column(Boolean, default=False, nullable=False)

    # Location (nullable)
    location_latitude = Column(Float, nullable=True)
    location_longitude = Column(Float, nullable=True)
    location_timestamp = Column(DateTime, nullable=True)
    location_accuracy = Column(Float, nullable=True)

    # Contact info
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)

    # Profile
    age = Column(Integer, nullable=True)
    slogan = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    firstName = Column(String, nullable=True)
    lastName = Column(String, nullable=True)

    @classmethod
    def from_pydantic(cls, user):
        """Create a UserTable row from a Pydantic User model."""
        return cls(
            userId=user.userId,
            isMember=user.isMember,
            show_location=user.settings.show_location.value if user.settings else "NO_ONE",
            show_email=user.settings.show_email if user.settings else False,
            show_phone=user.settings.show_phone if user.settings else False,
            location_update_interval_seconds=user.settings.location_update_interval_seconds if user.settings else 60,
            events_refresh_interval_seconds=user.settings.events_refresh_interval_seconds if user.settings else 60,
            background_location_updates=user.settings.background_location_updates if user.settings else False,
            location_latitude=user.location.latitude if user.location else None,
            location_longitude=user.location.longitude if user.location else None,
            location_timestamp=user.location.timestamp if user.location else None,
            location_accuracy=user.location.accuracy if user.location else None,
            contact_email=user.contact_info.email if user.contact_info else None,
            contact_phone=user.contact_info.phone if user.contact_info else None,
            age=user.age,
            slogan=user.slogan,
            avatar_url=user.avatar_url,
            firstName=user.firstName,
            lastName=user.lastName,
        )

    def to_dict(self):
        """Convert to a dict matching the Pydantic User model shape."""
        result = {
            "userId": self.userId,
            "isMember": self.isMember,
            "settings": {
                "show_location": self.show_location,
                "show_email": self.show_email,
                "show_phone": self.show_phone,
                "location_update_interval_seconds": self.location_update_interval_seconds,
                "events_refresh_interval_seconds": self.events_refresh_interval_seconds,
                "background_location_updates": self.background_location_updates,
            },
            "age": self.age,
            "slogan": self.slogan,
            "avatar_url": self.avatar_url,
            "firstName": self.firstName,
            "lastName": self.lastName,
        }
        if self.location_latitude is not None:
            result["location"] = {
                "latitude": self.location_latitude,
                "longitude": self.location_longitude,
                "timestamp": self.location_timestamp,
                "accuracy": self.location_accuracy,
            }
        else:
            result["location"] = None

        if self.contact_email is not None or self.contact_phone is not None:
            result["contact_info"] = {
                "email": self.contact_email,
                "phone": self.contact_phone,
            }
        else:
            result["contact_info"] = None

        return result


# ── Token Storage ─────────────────────────────────────────────────────────────

class TokenStorageTable(Base):
    __tablename__ = "token_storage"

    userId = Column(Integer, primary_key=True)
    externalAccessToken = Column(String, nullable=False)
    createdAt = Column(DateTime, nullable=False)
    expiresAt = Column(DateTime, nullable=False)


# ── User Events ───────────────────────────────────────────────────────────────

class UserEventTable(Base):
    __tablename__ = "user_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    userId = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    start = Column(DateTime, nullable=False)
    end = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)
    maxAttendees = Column(Integer, nullable=True)

    # Location (flattened)
    location_description = Column(String, nullable=True)
    location_address = Column(String, nullable=True)
    location_marker = Column(String, nullable=True)
    location_latitude = Column(Float, nullable=True)
    location_longitude = Column(Float, nullable=True)

    # Relationships
    hosts = relationship("EventHostTable", back_populates="event", cascade="all, delete-orphan")
    suggested_hosts = relationship("EventSuggestedHostTable", back_populates="event", cascade="all, delete-orphan")
    attendees = relationship("EventAttendeeTable", back_populates="event", cascade="all, delete-orphan")
    reports = relationship("EventReportTable", back_populates="event", cascade="all, delete-orphan")

    def to_dict(self):
        """Convert to a dict matching the Pydantic UserEvent model shape."""
        location = None
        if any([self.location_description, self.location_address, self.location_latitude]):
            location = {
                "description": self.location_description,
                "address": self.location_address,
                "marker": self.location_marker,
                "latitude": self.location_latitude,
                "longitude": self.location_longitude,
            }
        return {
            "_id": str(self.id),
            "userId": self.userId,
            "name": self.name,
            "start": self.start,
            "end": self.end,
            "description": self.description,
            "maxAttendees": self.maxAttendees,
            "location": location,
            "hosts": [{"userId": h.userId} for h in self.hosts],
            "suggested_hosts": [{"userId": h.userId} for h in self.suggested_hosts],
            "attendees": [{"userId": a.userId} for a in self.attendees],
            "reports": [{"userId": r.userId, "text": r.text} for r in self.reports],
        }


class EventHostTable(Base):
    __tablename__ = "event_hosts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("user_events.id", ondelete="CASCADE"), nullable=False)
    userId = Column(Integer, nullable=False)

    event = relationship("UserEventTable", back_populates="hosts")


class EventSuggestedHostTable(Base):
    __tablename__ = "event_suggested_hosts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("user_events.id", ondelete="CASCADE"), nullable=False)
    userId = Column(Integer, nullable=False)

    event = relationship("UserEventTable", back_populates="suggested_hosts")


class EventAttendeeTable(Base):
    __tablename__ = "event_attendees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("user_events.id", ondelete="CASCADE"), nullable=False)
    userId = Column(Integer, nullable=False)

    event = relationship("UserEventTable", back_populates="attendees")


class EventReportTable(Base):
    __tablename__ = "event_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("user_events.id", ondelete="CASCADE"), nullable=False)
    userId = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)

    event = relationship("UserEventTable", back_populates="reports")


# ── External Events ───────────────────────────────────────────────────────────

class ExternalEventDetailsTable(Base):
    __tablename__ = "external_event_details"

    eventId = Column(Integer, primary_key=True)
    eventDate = Column(DateTime, nullable=True)
    startTime = Column(String, nullable=False)
    endTime = Column(String, nullable=False)
    titel = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    speaker = Column(String, nullable=False)
    location = Column(String, nullable=False)
    locationInfo = Column(String, nullable=True)
    mapUrl = Column(String, nullable=True)
    isFree = Column(Boolean, nullable=False)
    price = Column(Integer, nullable=False)
    isLimited = Column(Boolean, nullable=False)
    stock = Column(Integer, nullable=False)
    showBooked = Column(Boolean, nullable=False)
    booked = Column(Integer, nullable=False)
    dateBookingStart = Column(String, nullable=True)
    dateBookingEnd = Column(String, nullable=True)
    imageUrl150 = Column(String, nullable=True)
    imageUrl300 = Column(String, nullable=True)
    eventUrl = Column(String, nullable=False)

    admins = relationship("ExternalEventAdminTable", back_populates="event", cascade="all, delete-orphan")
    categories = relationship("ExternalEventCategoryTable", back_populates="event", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "eventId": self.eventId,
            "eventDate": self.eventDate,
            "startTime": self.startTime,
            "endTime": self.endTime,
            "titel": self.titel,
            "description": self.description,
            "speaker": self.speaker,
            "location": self.location,
            "locationInfo": self.locationInfo,
            "mapUrl": self.mapUrl,
            "admins": [a.admin_id for a in self.admins] if self.admins else None,
            "isFree": self.isFree,
            "price": self.price,
            "isLimited": self.isLimited,
            "stock": self.stock,
            "showBooked": self.showBooked,
            "booked": self.booked,
            "dateBookingStart": self.dateBookingStart,
            "dateBookingEnd": self.dateBookingEnd,
            "categories": [{"code": c.code, "text": c.text, "colorText": c.colorText, "colorBackground": c.colorBackground} for c in self.categories] if self.categories else None,
            "imageUrl150": self.imageUrl150,
            "imageUrl300": self.imageUrl300,
            "eventUrl": self.eventUrl,
        }


class ExternalEventAdminTable(Base):
    __tablename__ = "external_event_admins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    eventId = Column(Integer, ForeignKey("external_event_details.eventId", ondelete="CASCADE"), nullable=False)
    admin_id = Column(String, nullable=False)

    event = relationship("ExternalEventDetailsTable", back_populates="admins")


class ExternalEventCategoryTable(Base):
    __tablename__ = "external_event_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    eventId = Column(Integer, ForeignKey("external_event_details.eventId", ondelete="CASCADE"), nullable=False)
    code = Column(String, nullable=False)
    text = Column(String, nullable=False)
    colorText = Column(String, nullable=False)
    colorBackground = Column(String, nullable=False)

    event = relationship("ExternalEventDetailsTable", back_populates="categories")


# ── External Root ─────────────────────────────────────────────────────────────

class ExternalRootTable(Base):
    __tablename__ = "external_root"

    id = Column(Integer, primary_key=True, autoincrement=True)
    version = Column(Integer, nullable=False)
    loginUrl = Column(String, nullable=False)
    restUrl = Column(String, nullable=False)
    siteUrl = Column(String, nullable=False)
    header1 = Column(String, nullable=False)
    header2 = Column(String, nullable=False)
    city = Column(String, nullable=False)
    streetAddress = Column(String, nullable=False)
    mapUrl = Column(String, nullable=False)

    dates = relationship("ExternalRootDateTable", back_populates="root", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "version": self.version,
            "loginUrl": self.loginUrl,
            "restUrl": self.restUrl,
            "siteUrl": self.siteUrl,
            "dates": [d.date_value for d in self.dates],
            "header1": self.header1,
            "header2": self.header2,
            "city": self.city,
            "streetAddress": self.streetAddress,
            "mapUrl": self.mapUrl,
        }


class ExternalRootDateTable(Base):
    __tablename__ = "external_root_dates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    root_id = Column(Integer, ForeignKey("external_root.id", ondelete="CASCADE"), nullable=False)
    date_value = Column(String, nullable=False)

    root = relationship("ExternalRootTable", back_populates="dates")


class ExternalEventBookingTable(Base):
    __tablename__ = "external_event_bookings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    userId = Column(Integer, nullable=False, index=True)
    eventId = Column(Integer, nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("userId", "eventId", name="uq_external_event_booking"),
    )
