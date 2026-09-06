"""Add tags column to user_events.

Revision ID: 002
Revises: 001
Create Date: 2026-09-06

The interest tag picker (#304) added `tags` to the UserEvent model. Under
MongoDB that needed no schema change — the document store accepted the new
field and `model_dump()` wrote it wholesale. The PostgreSQL table is fully
columnar, so without this column the tags were accepted by the API and
silently discarded on write.

Stored as JSON rather than a child table: a tag is a denormalised snapshot of
the /v1/tags catalog (code, text and both colours travel together) and is
never queried by tag on the server — the category filter runs client-side.

Existing rows get an empty list rather than NULL so readers never have to
distinguish "no tags" from "written before this migration".
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # JSONB on PostgreSQL; the ORM model keeps generic JSON so the SQLite-backed
    # tests still work. Matches how 001 handles interests/social_vibes.
    op.add_column(
        "user_events",
        sa.Column(
            "tags",
            postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"),
            nullable=True,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.execute("UPDATE user_events SET tags = '[]'::jsonb WHERE tags IS NULL")


def downgrade() -> None:
    op.drop_column("user_events", "tags")
