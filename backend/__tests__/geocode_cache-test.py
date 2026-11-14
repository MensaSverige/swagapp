"""Tests for the persistent geocode cache.

The member calendar sync geocodes roughly 424 distinct places, and it runs
every thirty minutes. Without a cache that outlives one run, those same 424
lookups are bought from Google 48 times a day for answers that never change.
"""

import pytest

from v1.db.database import get_session
from v1.db.tables import GeocodeCacheTable
from v1.google_maps_api import geocode_cache
from v1.google_maps_api.geocode_cache import geocode_cached


@pytest.fixture
def geocoder(monkeypatch):
    """Stand in for Google, recording every query that reaches it."""
    calls = []

    def fake(query):
        calls.append(query)
        return (59.27, 15.21) if query != "nowhere" else None

    monkeypatch.setattr(geocode_cache, "geocode_address", fake)
    return calls


def test_first_lookup_asks_google(geocoder):
    assert geocode_cached("70218 Örebro, SE") == (59.27, 15.21)
    assert geocoder == ["70218 Örebro, SE"]


def test_second_lookup_comes_from_the_cache(geocoder):
    geocode_cached("70218 Örebro, SE")
    assert geocode_cached("70218 Örebro, SE") == (59.27, 15.21)
    assert len(geocoder) == 1


def test_a_failed_lookup_is_remembered_too():
    """Otherwise every unresolvable address is bought again on every run."""
    calls = []

    def fake(query):
        calls.append(query)
        return None

    import v1.google_maps_api.geocode_cache as module
    original = module.geocode_address
    module.geocode_address = fake
    try:
        assert geocode_cached("nowhere") is None
        assert geocode_cached("nowhere") is None
    finally:
        module.geocode_address = original
    assert len(calls) == 1


def test_queries_differing_only_in_spacing_and_case_share_an_entry(geocoder):
    geocode_cached("70218 Örebro, SE")
    geocode_cached("  70218   örebro, se ")
    assert len(geocoder) == 1


def test_different_places_are_cached_apart(geocoder):
    geocode_cached("Lund, Sverige")
    geocode_cached("Malmö, Sverige")
    assert len(geocoder) == 2


def test_the_answer_is_stored_in_the_table(geocoder):
    geocode_cached("Lund, Sverige")
    with get_session() as session:
        row = session.query(GeocodeCacheTable).one()
    assert row.query == "lund, sverige"
    assert (row.latitude, row.longitude) == (59.27, 15.21)
    assert row.found is True


def test_a_geocoder_failure_is_not_cached(monkeypatch):
    """A network error says nothing about the address. Try again next run."""
    calls = []

    def boom(query):
        calls.append(query)
        raise RuntimeError("google is down")

    monkeypatch.setattr(geocode_cache, "geocode_address", boom)
    assert geocode_cached("Lund, Sverige") is None
    assert geocode_cached("Lund, Sverige") is None
    assert len(calls) == 2
    with get_session() as session:
        assert session.query(GeocodeCacheTable).count() == 0


def test_an_empty_query_never_reaches_google(geocoder):
    assert geocode_cached("") is None
    assert geocode_cached("   ") is None
    assert geocoder == []
