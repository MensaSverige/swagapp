"""Add the unified events table.

Revision ID: 003
Revises: 002
Create Date: 2026-09-07

Restores, in PostgreSQL, the `unifiedevents` collection the Mongo cutover
dropped: one row per event from any source, identified by (source, source_id).

The member calendar sync (#110) is the first writer. `user_events` and
`external_event_details` keep their own tables for now and are still mapped
into the unified `Event` shape on read; folding them in here is a separate
change, which is why this table carries no attendee or host child tables yet.

Per-viewer fields (`attending`, `bookable`) are deliberately absent -- they are
properties of who is looking, not of the event, and are derived at read time.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# JSONB on PostgreSQL, plain JSON on SQLite so the tests can build the same
# table. Matches how 001 handles interests/social_vibes and 002 handles tags.
def _json():
    return postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite")


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("source_id", sa.String(), nullable=False),
        sa.Column("parentEvent", sa.String(), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("location_description", sa.String(), nullable=True),
        sa.Column("location_address", sa.String(), nullable=True),
        sa.Column("location_marker", sa.String(), nullable=True),
        sa.Column("location_latitude", sa.Float(), nullable=True),
        sa.Column("location_longitude", sa.Float(), nullable=True),
        # timestamptz throughout, per the project's datetime convention: naive
        # values are localized at the write boundary, never stripped.
        sa.Column("start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled", sa.DateTime(timezone=True), nullable=True),
        sa.Column("imageUrl", sa.String(), nullable=True),
        sa.Column("bookingStart", sa.DateTime(timezone=True), nullable=True),
        sa.Column("bookingEnd", sa.DateTime(timezone=True), nullable=True),
        sa.Column("showAttendees", sa.String(), nullable=False, server_default="none"),
        sa.Column("maxAttendees", sa.Integer(), nullable=True),
        sa.Column("price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("official", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("admin", _json(), nullable=True),
        sa.Column("hosts", _json(), nullable=True),
        sa.Column("tags", _json(), nullable=True),
        sa.Column("extras", _json(), nullable=True),
        sa.Column("source_created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("source_updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        # A sync upserts on this pair, so a re-run updates in place instead of
        # accumulating duplicates. No separate index on source_id: this
        # constraint is already backed by one.
        sa.UniqueConstraint("source", "source_id", name="uq_event_source_id"),
    )
    op.create_index("ix_events_start", "events", ["start"])
    op.create_index("ix_events_source", "events", ["source"])


def downgrade() -> None:
    op.drop_index("ix_events_source", table_name="events")
    op.drop_index("ix_events_start", table_name="events")
    op.drop_table("events")
