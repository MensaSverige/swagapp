"""Geocoding that remembers its answers.

`geocode_address` talks to Google every time it is called. The member calendar
sync needs coordinates for several hundred distinct places and runs every
thirty minutes, so calling it directly buys the same answers roughly fifty
times a day. This module is the one way the sync asks: it reads the answer out
of `geocode_cache` and only reaches Google for a place it has never seen.

Docs: docs/Geocoding.md
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from v1.db.database import get_session
from v1.db.tables import GeocodeCacheTable
from v1.google_maps_api.geolocation_api import GeocodedPlace, geocode_address


logger = logging.getLogger(__name__)


def _normalize(query: str) -> str:
    """`  70218   Örebro, SE ` and `70218 örebro, se` are one place."""
    return " ".join(query.lower().split())


def geocode_cached(query: Optional[str]) -> Optional[GeocodedPlace]:
    """Coordinates for `query`, from the cache where possible.

    Returns None when the geocoder cannot place the address, and remembers
    that too. A geocoder *failure* -- an exception, or no key configured --
    is not remembered: it says nothing about the address, so the next run
    asks again.
    """
    if not query or not query.strip():
        return None

    key = _normalize(query)

    with get_session() as session:
        cached = session.get(GeocodeCacheTable, key)
        if cached is not None:
            if not cached.found:
                return None
            return GeocodedPlace(
                latitude=cached.latitude,
                longitude=cached.longitude,
                radius_meters=cached.radius_meters,
                precision=cached.precision,
            )

    try:
        place = geocode_address(query)
    except Exception as e:
        logger.warning("Geocoding %r failed, not caching: %s", query, e)
        return None

    _remember(key, place)
    return place


def _remember(key: str, place: Optional[GeocodedPlace]) -> None:
    """Store one answer. A concurrent writer winning the race is not an error."""
    try:
        with get_session() as session:
            row = session.get(GeocodeCacheTable, key)
            if row is None:
                row = GeocodeCacheTable(query=key)
                session.add(row)
            row.found = place is not None
            row.latitude = place.latitude if place else None
            row.longitude = place.longitude if place else None
            row.radius_meters = place.radius_meters if place else None
            row.precision = place.precision if place else None
            row.updated_at = datetime.now(timezone.utc)
            session.commit()
    except Exception as e:
        logger.warning("Could not cache the geocode of %r: %s", key, e)
