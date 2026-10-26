"""The production database URL must load a driver that is actually installed.

The rest of the suite runs on SQLite, so nothing else here touches the
PostgreSQL driver. CloudNativePG hands the backend a plain postgresql:// URL,
and SQLAlchemy picks the driver for that scheme itself: psycopg2 up to 2.0,
psycopg (v3) from 2.1. When the two disagreed, the backend image crashed at
startup with "No module named 'psycopg'" while every test here passed.
"""

from sqlalchemy import create_engine


def test_cloudnativepg_url_loads_installed_driver():
    # Same shape as the uri key of the swagapp-db-app Secret. create_engine
    # imports the driver without connecting, so no database is needed.
    engine = create_engine("postgresql://app:secret@swagapp-db-rw.swagapp:5432/app")
    engine.dispose()
