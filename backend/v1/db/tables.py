"""SQLAlchemy table definitions for all database models."""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Index, Integer, String, Boolean, Float,
    DateTime, Text, ForeignKey, JSON, UniqueConstraint, CheckConstraint,
)
from sqlalchemy.orm import relationship
from v1.db.database import Base


def _now():
    return datetime.now(timezone.utc)


# ── User ──────────────────────────────────────────────────────────────────────

class UserTable(Base):
    __tablename__ = "users"

    userId = Column(Integer, primary_key=True)
    isMember = Column(Boolean, default=False, nullable=False)

    # Settings (flattened from UserSettings)
    show_location = Column(String, default="NO_ONE", nullable=False)
    show_profile = Column(String, default="MEMBERS_MUTUAL", nullable=False)
    show_email = Column(String, default="NO_ONE", nullable=False)
    show_phone = Column(String, default="NO_ONE", nullable=False)
    show_interests = Column(String, default="MEMBERS_MUTUAL", nullable=False)
    show_hometown = Column(String, default="MEMBERS_MUTUAL", nullable=False)
    show_birthdate = Column(String, default="MEMBERS_MUTUAL", nullable=False)
    show_gender = Column(String, default="NO_ONE", nullable=False)
    show_sexuality = Column(String, default="NO_ONE", nullable=False)
    show_relationship_style = Column(String, default="NO_ONE", nullable=False)
    show_relationship_status = Column(String, default="NO_ONE", nullable=False)
    show_social_vibes = Column(String, default="MEMBERS_MUTUAL", nullable=False)
    show_pronomen = Column(String, default="NO_ONE", nullable=False)
    show_attendance = Column(String, default="MEMBERS_MUTUAL", nullable=True)
    location_update_interval_seconds = Column(Integer, default=60, nullable=False)
    events_refresh_interval_seconds = Column(Integer, default=60, nullable=False)
    background_location_updates = Column(Boolean, default=False, nullable=False)

    # Location (nullable)
    location_latitude = Column(Float, nullable=True)
    location_longitude = Column(Float, nullable=True)
    location_timestamp = Column(DateTime(timezone=True), nullable=True)
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
    interests = Column(JSON, nullable=True, default=list)
    hometown = Column(String, nullable=True)
    birthdate = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    sexuality = Column(String, nullable=True)
    relationship_style = Column(String, nullable=True)
    relationship_status = Column(String, nullable=True)
    social_vibes = Column(JSON, nullable=True, default=list)
    pronomen = Column(String, nullable=True)

    # Audit
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    @classmethod
    def from_pydantic(cls, user):
        s = user.settings if user.settings else None
        return cls(
            userId=user.userId,
            isMember=user.isMember,
            show_location=s.show_location.value if s else "NO_ONE",
            show_profile=s.show_profile.value if s else "MEMBERS_MUTUAL",
            show_email=s.show_email.value if s else "NO_ONE",
            show_phone=s.show_phone.value if s else "NO_ONE",
            show_interests=s.show_interests.value if s else "MEMBERS_MUTUAL",
            show_hometown=s.show_hometown.value if s else "MEMBERS_MUTUAL",
            show_birthdate=s.show_birthdate.value if s else "MEMBERS_MUTUAL",
            show_gender=s.show_gender.value if s else "NO_ONE",
            show_sexuality=s.show_sexuality.value if s else "NO_ONE",
            show_relationship_style=s.show_relationship_style.value if s else "NO_ONE",
            show_relationship_status=s.show_relationship_status.value if s else "NO_ONE",
            show_social_vibes=s.show_social_vibes.value if s else "MEMBERS_MUTUAL",
            show_pronomen=s.show_pronomen.value if s else "NO_ONE",
            show_attendance=s.show_attendance.value if (s and s.show_attendance) else "MEMBERS_MUTUAL",
            location_update_interval_seconds=s.location_update_interval_seconds if s else 60,
            events_refresh_interval_seconds=s.events_refresh_interval_seconds if s else 60,
            background_location_updates=s.background_location_updates if s else False,
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
            interests=[i.value if hasattr(i, "value") else i for i in user.interests] if user.interests else [],
            hometown=user.hometown,
            birthdate=user.birthdate,
            gender=user.gender,
            sexuality=user.sexuality,
            relationship_style=user.relationship_style,
            relationship_status=user.relationship_status,
            social_vibes=list(user.social_vibes) if user.social_vibes else [],
            pronomen=user.pronomen,
        )

    def to_dict(self):
        result = {
            "userId": self.userId,
            "isMember": self.isMember,
            "settings": {
                "show_location": self.show_location,
                "show_profile": self.show_profile,
                "show_email": self.show_email,
                "show_phone": self.show_phone,
                "show_interests": self.show_interests,
                "show_hometown": self.show_hometown,
                "show_birthdate": self.show_birthdate,
                "show_gender": self.show_gender,
                "show_sexuality": self.show_sexuality,
                "show_relationship_style": self.show_relationship_style,
                "show_relationship_status": self.show_relationship_status,
                "show_social_vibes": self.show_social_vibes,
                "show_pronomen": self.show_pronomen,
                "show_attendance": self.show_attendance,
                "location_update_interval_seconds": self.location_update_interval_seconds,
                "events_refresh_interval_seconds": self.events_refresh_interval_seconds,
                "background_location_updates": self.background_location_updates,
            },
            "age": self.age,
            "slogan": self.slogan,
            "avatar_url": self.avatar_url,
            "firstName": self.firstName,
            "lastName": self.lastName,
            "interests": self.interests or [],
            "hometown": self.hometown,
            "birthdate": self.birthdate,
            "gender": self.gender,
            "sexuality": self.sexuality,
            "relationship_style": self.relationship_style,
            "relationship_status": self.relationship_status,
            "social_vibes": self.social_vibes or [],
            "pronomen": self.pronomen,
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
    createdAt = Column(DateTime(timezone=True), nullable=False)
    expiresAt = Column(DateTime(timezone=True), nullable=False)


# ── User Events ───────────────────────────────────────────────────────────────

class UserEventTable(Base):
    __tablename__ = "user_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    userId = Column(Integer, nullable=False, index=True)
    name = Column(String, nullable=False)
    start = Column(DateTime(timezone=True), nullable=False, index=True)
    end = Column(DateTime(timezone=True), nullable=True)
    description = Column(Text, nullable=True)
    maxAttendees = Column(Integer, nullable=True)

    # Location (flattened)
    location_description = Column(String, nullable=True)
    location_address = Column(String, nullable=True)
    location_marker = Column(String, nullable=True)
    location_latitude = Column(Float, nullable=True)
    location_longitude = Column(Float, nullable=True)

    # Audit
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    # Relationships
    hosts = relationship("EventHostTable", back_populates="event", cascade="all, delete-orphan")
    suggested_hosts = relationship("EventSuggestedHostTable", back_populates="event", cascade="all, delete-orphan")
    attendees = relationship("EventAttendeeTable", back_populates="event", cascade="all, delete-orphan")
    reports = relationship("EventReportTable", back_populates="event", cascade="all, delete-orphan")

    def to_dict(self):
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
    event_id = Column(Integer, ForeignKey("user_events.id", ondelete="CASCADE"), nullable=False, index=True)
    userId = Column(Integer, nullable=False)

    event = relationship("UserEventTable", back_populates="hosts")


class EventSuggestedHostTable(Base):
    __tablename__ = "event_suggested_hosts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("user_events.id", ondelete="CASCADE"), nullable=False, index=True)
    userId = Column(Integer, nullable=False)

    event = relationship("UserEventTable", back_populates="suggested_hosts")


class EventAttendeeTable(Base):
    __tablename__ = "event_attendees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("user_events.id", ondelete="CASCADE"), nullable=False, index=True)
    userId = Column(Integer, nullable=False)

    event = relationship("UserEventTable", back_populates="attendees")

    __table_args__ = (
        UniqueConstraint("event_id", "userId", name="uq_event_attendee"),
    )


class EventReportTable(Base):
    __tablename__ = "event_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("user_events.id", ondelete="CASCADE"), nullable=False, index=True)
    userId = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)

    event = relationship("UserEventTable", back_populates="reports")


# ── External Events ───────────────────────────────────────────────────────────

class ExternalEventDetailsTable(Base):
    __tablename__ = "external_event_details"

    eventId = Column(Integer, primary_key=True)
    eventDate = Column(DateTime(timezone=True), nullable=True)
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

    # Audit
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

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
    eventId = Column(Integer, ForeignKey("external_event_details.eventId", ondelete="CASCADE"), nullable=False, index=True)
    admin_id = Column(String, nullable=False)

    event = relationship("ExternalEventDetailsTable", back_populates="admins")


class ExternalEventCategoryTable(Base):
    __tablename__ = "external_event_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    eventId = Column(Integer, ForeignKey("external_event_details.eventId", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String, nullable=False)
    text = Column(String, nullable=False)
    colorText = Column(String, nullable=False)
    colorBackground = Column(String, nullable=False)

    event = relationship("ExternalEventDetailsTable", back_populates="categories")


# ── External Root ─────────────────────────────────────────────────────────────

class ExternalRootTable(Base):
    """Singleton table — at most one row enforced by a CHECK constraint on id."""
    __tablename__ = "external_root"

    id = Column(Integer, primary_key=True, default=1)
    version = Column(Integer, nullable=False)
    loginUrl = Column(String, nullable=False)
    restUrl = Column(String, nullable=False)
    siteUrl = Column(String, nullable=False)
    header1 = Column(String, nullable=False)
    header2 = Column(String, nullable=False)
    city = Column(String, nullable=False)
    streetAddress = Column(String, nullable=False)
    mapUrl = Column(String, nullable=False)

    # Audit
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    dates = relationship("ExternalRootDateTable", back_populates="root", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("id = 1", name="ck_external_root_singleton"),
    )

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


# ── Feedback ──────────────────────────────────────────────────────────────────

class FeedbackVoteTable(Base):
    __tablename__ = "feedback_votes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    issue_number = Column(Integer, nullable=False, index=True)
    user_hash = Column(String, nullable=False)
    value = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("issue_number", "user_hash", name="uq_feedback_vote"),
    )


class FeedbackUserIndexTable(Base):
    __tablename__ = "feedback_user_index"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_hash = Column(String, nullable=False, unique=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    member_number = Column(String, nullable=True)
    is_member = Column(Boolean, nullable=False, default=False)
    first_seen = Column(DateTime(timezone=True), nullable=False)
    last_seen = Column(DateTime(timezone=True), nullable=False)
