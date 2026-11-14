"""Add main event registrations and the user event parent link.

Revision ID: 004
Revises: 003
Create Date: 2026-11-14

A main event is a row in the unified `events` table (the riksträff and the
member calendar events). Members register (anmälan) to one, and events can
belong to one through `parentEvent`.

`main_event_attendees.event_id` holds the unified id (cal42, root2026-11-20)
rather than a foreign key: main events are identified by (source, source_id)
and the prefix is what routes an attend request.

`user_events.parent_event` is nullable, so existing user events stay
standalone.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "main_event_attendees",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        # Also backs the lookup of everyone registered to one event.
        sa.UniqueConstraint("event_id", "user_id", name="uq_main_event_attendee"),
    )
    op.create_index("ix_main_event_attendees_user_id", "main_event_attendees", ["user_id"])

    op.add_column("user_events", sa.Column("parent_event", sa.String(), nullable=True))
    op.create_index("ix_user_events_parent_event", "user_events", ["parent_event"])


def downgrade() -> None:
    op.drop_index("ix_user_events_parent_event", table_name="user_events")
    op.drop_column("user_events", "parent_event")
    op.drop_index("ix_main_event_attendees_user_id", table_name="main_event_attendees")
    op.drop_table("main_event_attendees")
