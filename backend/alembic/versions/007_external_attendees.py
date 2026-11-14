"""Cache who is registered to the riksträff, from the booking site.

Revision ID: 007
Revises: 006
Create Date: 2026-11-14

The booking site lists the people registered to the riksträff (operation
`attendees`), already leaving out anyone who chose not to be shown, and says
how many are registered in all. The backend fetches it every 15 minutes with
its own token, so the app can show the participants and the total without a
call to the site per viewer.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "external_attendees",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("member_id", sa.String(), nullable=False),
        sa.Column("first_name", sa.String(), nullable=True),
        sa.Column("last_name", sa.String(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("registered", sa.String(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_external_attendees_member_id", "external_attendees", ["member_id"])
    op.create_table(
        "external_attendee_count",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("external_attendee_count")
    op.drop_index("ix_external_attendees_member_id", table_name="external_attendees")
    op.drop_table("external_attendees")
