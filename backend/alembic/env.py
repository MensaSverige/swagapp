"""
Alembic migration environment.

Workflow:
  - Run from the backend/ directory (where alembic.ini lives).
  - DATABASE_URL is read from the environment; no credentials are hardcoded.
  - On first deploy against a DB created by the old create_all() call, the
    startup code in database.py stamps the DB at head automatically, so
    Alembic knows it's already fully up to date without re-running the
    initial migration.
  - To generate a new migration:
        cd backend/
        alembic revision --autogenerate -m "describe the change"
  - To apply migrations:
        cd backend/
        alembic upgrade head
  - To check current state:
        cd backend/
        alembic current
"""

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Make sure v1 package is importable when running alembic directly.
# alembic.ini sets prepend_sys_path = . which adds backend/ to sys.path,
# but we guard here as well for safety.
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# Import Base and all models so metadata is fully populated.
from v1.db.database import Base  # noqa: E402
import v1.db.tables  # noqa: E402, F401

# this is the Alembic Config object, which provides access to the values
# within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the SQLAlchemy URL from the environment, overriding the placeholder
# in alembic.ini.
database_url = os.environ.get(
    "DATABASE_URL",
    "postgresql://swag:swag@postgres:5432/swag",
)
config.set_main_option("sqlalchemy.url", database_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (emit SQL to stdout, no connection)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (requires a live DB connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
