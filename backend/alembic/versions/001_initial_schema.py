"""Initial schema — all tables from the original create_all() baseline.

Revision ID: 001
Revises:
Create Date: 2026-05-15

This migration represents the complete schema as it existed when Alembic was
first introduced.  Existing databases that were created by Base.metadata.create_all()
before Alembic was added should be *stamped* at this revision (alembic stamp head)
rather than having this migration run, because the tables already exist.
The startup code in database.py handles that bootstrap automatically.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("userId", sa.Integer(), nullable=False),
        sa.Column("isMember", sa.Boolean(), nullable=False),
        sa.Column("show_location", sa.String(), nullable=False),
        sa.Column("show_profile", sa.String(), nullable=False),
        sa.Column("show_email", sa.String(), nullable=False),
        sa.Column("show_phone", sa.String(), nullable=False),
        sa.Column("show_interests", sa.String(), nullable=False),
        sa.Column("show_hometown", sa.String(), nullable=False),
        sa.Column("show_birthdate", sa.String(), nullable=False),
        sa.Column("show_gender", sa.String(), nullable=False),
        sa.Column("show_sexuality", sa.String(), nullable=False),
        sa.Column("show_relationship_style", sa.String(), nullable=False),
        sa.Column("show_relationship_status", sa.String(), nullable=False),
        sa.Column("show_social_vibes", sa.String(), nullable=False),
        sa.Column("show_pronomen", sa.String(), nullable=False),
        sa.Column("show_attendance", sa.String(), nullable=True),
        sa.Column("location_update_interval_seconds", sa.Integer(), nullable=False),
        sa.Column("events_refresh_interval_seconds", sa.Integer(), nullable=False),
        sa.Column("background_location_updates", sa.Boolean(), nullable=False),
        sa.Column("location_latitude", sa.Float(), nullable=True),
        sa.Column("location_longitude", sa.Float(), nullable=True),
        sa.Column("location_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("location_accuracy", sa.Float(), nullable=True),
        sa.Column("contact_email", sa.String(), nullable=True),
        sa.Column("contact_phone", sa.String(), nullable=True),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("slogan", sa.String(), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("firstName", sa.String(), nullable=True),
        sa.Column("lastName", sa.String(), nullable=True),
        sa.Column("interests", sa.JSON(), nullable=True),
        sa.Column("hometown", sa.String(), nullable=True),
        sa.Column("birthdate", sa.String(), nullable=True),
        sa.Column("gender", sa.String(), nullable=True),
        sa.Column("sexuality", sa.String(), nullable=True),
        sa.Column("relationship_style", sa.String(), nullable=True),
        sa.Column("relationship_status", sa.String(), nullable=True),
        sa.Column("social_vibes", sa.JSON(), nullable=True),
        sa.Column("pronomen", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("userId"),
    )

    # ── token_storage ─────────────────────────────────────────────────────────
    op.create_table(
        "token_storage",
        sa.Column("userId", sa.Integer(), nullable=False),
        sa.Column("externalAccessToken", sa.String(), nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expiresAt", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("userId"),
    )

    # ── user_events ───────────────────────────────────────────────────────────
    op.create_table(
        "user_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("userId", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("maxAttendees", sa.Integer(), nullable=True),
        sa.Column("location_description", sa.String(), nullable=True),
        sa.Column("location_address", sa.String(), nullable=True),
        sa.Column("location_marker", sa.String(), nullable=True),
        sa.Column("location_latitude", sa.Float(), nullable=True),
        sa.Column("location_longitude", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_events_userId", "user_events", ["userId"])
    op.create_index("ix_user_events_start", "user_events", ["start"])

    # ── event_hosts ───────────────────────────────────────────────────────────
    op.create_table(
        "event_hosts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("userId", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["user_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "userId", name="uq_event_host"),
    )
    op.create_index("ix_event_hosts_event_id", "event_hosts", ["event_id"])

    # ── event_suggested_hosts ─────────────────────────────────────────────────
    op.create_table(
        "event_suggested_hosts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("userId", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["user_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "userId", name="uq_event_suggested_host"),
    )
    op.create_index("ix_event_suggested_hosts_event_id", "event_suggested_hosts", ["event_id"])

    # ── event_attendees ───────────────────────────────────────────────────────
    op.create_table(
        "event_attendees",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("userId", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["user_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "userId", name="uq_event_attendee"),
    )
    op.create_index("ix_event_attendees_event_id", "event_attendees", ["event_id"])

    # ── event_reports ─────────────────────────────────────────────────────────
    op.create_table(
        "event_reports",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("userId", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["user_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_event_reports_event_id", "event_reports", ["event_id"])

    # ── external_event_details ────────────────────────────────────────────────
    op.create_table(
        "external_event_details",
        sa.Column("eventId", sa.Integer(), nullable=False),
        sa.Column("eventDate", sa.DateTime(timezone=True), nullable=True),
        sa.Column("startTime", sa.String(), nullable=False),
        sa.Column("endTime", sa.String(), nullable=False),
        sa.Column("titel", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("speaker", sa.String(), nullable=False),
        sa.Column("location", sa.String(), nullable=False),
        sa.Column("locationInfo", sa.String(), nullable=True),
        sa.Column("mapUrl", sa.String(), nullable=True),
        sa.Column("isFree", sa.Boolean(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("isLimited", sa.Boolean(), nullable=False),
        sa.Column("stock", sa.Integer(), nullable=False),
        sa.Column("showBooked", sa.Boolean(), nullable=False),
        sa.Column("booked", sa.Integer(), nullable=False),
        sa.Column("dateBookingStart", sa.String(), nullable=True),
        sa.Column("dateBookingEnd", sa.String(), nullable=True),
        sa.Column("imageUrl150", sa.String(), nullable=True),
        sa.Column("imageUrl300", sa.String(), nullable=True),
        sa.Column("eventUrl", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("eventId"),
    )

    # ── external_event_admins ─────────────────────────────────────────────────
    op.create_table(
        "external_event_admins",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("eventId", sa.Integer(), nullable=False),
        sa.Column("admin_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["eventId"], ["external_event_details.eventId"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_external_event_admins_eventId", "external_event_admins", ["eventId"])

    # ── external_event_categories ─────────────────────────────────────────────
    op.create_table(
        "external_event_categories",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("eventId", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("text", sa.String(), nullable=False),
        sa.Column("colorText", sa.String(), nullable=False),
        sa.Column("colorBackground", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["eventId"], ["external_event_details.eventId"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_external_event_categories_eventId", "external_event_categories", ["eventId"])

    # ── external_root ─────────────────────────────────────────────────────────
    op.create_table(
        "external_root",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("loginUrl", sa.String(), nullable=False),
        sa.Column("restUrl", sa.String(), nullable=False),
        sa.Column("siteUrl", sa.String(), nullable=False),
        sa.Column("header1", sa.String(), nullable=False),
        sa.Column("header2", sa.String(), nullable=False),
        sa.Column("city", sa.String(), nullable=False),
        sa.Column("streetAddress", sa.String(), nullable=False),
        sa.Column("mapUrl", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("id = 1", name="ck_external_root_singleton"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── external_root_dates ───────────────────────────────────────────────────
    op.create_table(
        "external_root_dates",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("root_id", sa.Integer(), nullable=False),
        sa.Column("date_value", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["root_id"], ["external_root.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── external_event_bookings ───────────────────────────────────────────────
    op.create_table(
        "external_event_bookings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("userId", sa.Integer(), nullable=False),
        sa.Column("eventId", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("userId", "eventId", name="uq_external_event_booking"),
    )
    op.create_index("ix_external_event_bookings_userId", "external_event_bookings", ["userId"])
    op.create_index("ix_external_event_bookings_eventId", "external_event_bookings", ["eventId"])

    # ── feedback_votes ────────────────────────────────────────────────────────
    op.create_table(
        "feedback_votes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("issue_number", sa.Integer(), nullable=False),
        sa.Column("user_hash", sa.String(), nullable=False),
        sa.Column("value", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("issue_number", "user_hash", name="uq_feedback_vote"),
    )
    op.create_index("ix_feedback_votes_issue_number", "feedback_votes", ["issue_number"])

    # ── feedback_user_index ───────────────────────────────────────────────────
    op.create_table(
        "feedback_user_index",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_hash", sa.String(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("member_number", sa.String(), nullable=True),
        sa.Column("is_member", sa.Boolean(), nullable=False),
        sa.Column("first_seen", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_hash"),
    )
    op.create_index("ix_feedback_user_index_user_hash", "feedback_user_index", ["user_hash"])
    op.create_index("ix_feedback_user_index_user_id", "feedback_user_index", ["user_id"])


def downgrade() -> None:
    op.drop_table("feedback_user_index")
    op.drop_table("feedback_votes")
    op.drop_table("external_event_bookings")
    op.drop_table("external_root_dates")
    op.drop_table("external_root")
    op.drop_table("external_event_categories")
    op.drop_table("external_event_admins")
    op.drop_table("external_event_details")
    op.drop_table("event_reports")
    op.drop_table("event_attendees")
    op.drop_table("event_suggested_hosts")
    op.drop_table("event_hosts")
    op.drop_table("user_events")
    op.drop_table("token_storage")
    op.drop_table("users")
