"""Record how precise each cached geocode is.

Revision ID: 006
Revises: 005
Create Date: 2026-11-14

A postal code and a city are not a venue. Google returns a box around every
result and says what kind of hit it was, so the cache keeps both: the radius
of a circle covering that box, and Google's own `location_type` lowercased.
The app can then draw a circle the size of the guess instead of a pin that
claims a street corner.

Existing rows keep NULL in both columns. They are re-geocoded only if they are
deleted; nothing reads a missing radius as zero.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("geocode_cache", sa.Column("radius_meters", sa.Integer(), nullable=True))
    op.add_column("geocode_cache", sa.Column("precision", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("geocode_cache", "precision")
    op.drop_column("geocode_cache", "radius_meters")
