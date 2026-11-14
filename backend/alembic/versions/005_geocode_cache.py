"""Add the geocode cache.

Revision ID: 005
Revises: 004
Create Date: 2026-11-14

The member calendar gives explicit coordinates for 80 of its ~4900 events, so
a sync run geocodes several hundred places from postal code and city. The sync
runs every thirty minutes and nothing remembered the answers, so the same few
hundred lookups were bought from Google roughly fifty times a day.

The query is the primary key, normalized to lowercase with its whitespace
collapsed, so one place has one row. A lookup the geocoder could not place is
stored with `found` false rather than left out -- an address nobody can place
is otherwise the one asked about most often.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "geocode_cache",
        sa.Column("query", sa.String(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("found", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("query"),
    )


def downgrade() -> None:
    op.drop_table("geocode_cache")
