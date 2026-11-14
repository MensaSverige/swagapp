"""Tests for how precise a geocode actually is.

A postal code and a city are not a venue. Google says how precise each answer
is and gives a box the place sits inside; both are carried through so the app
can draw a circle the size of the guess rather than a pin that claims a street
corner.
"""

import pytest

from v1.google_maps_api import geolocation_api as g
from v1.google_maps_api.geolocation_api import GeocodedPlace, geocode_address


def _result(lat, lng, location_type, half_side_degrees):
    """A Google geocode result with a square viewport around the point."""
    return [{
        "geometry": {
            "location": {"lat": lat, "lng": lng},
            "location_type": location_type,
            "viewport": {
                "northeast": {"lat": lat + half_side_degrees, "lng": lng + half_side_degrees},
                "southwest": {"lat": lat - half_side_degrees, "lng": lng - half_side_degrees},
            },
        }
    }]


@pytest.fixture
def google(monkeypatch):
    """A stand-in Google whose answer each test sets."""
    answer = {}

    class Client:
        def geocode(self, address):
            return answer.get("value", [])

    monkeypatch.setattr(g, "GOOGLE_GEOCODING_API_KEY", "key")
    monkeypatch.setattr(g, "gmaps", Client(), raising=False)
    return answer


def test_a_rooftop_hit_is_a_small_circle(google):
    # ~0.0005 degrees is some tens of metres.
    google["value"] = _result(59.33, 18.06, "ROOFTOP", 0.0005)
    place = geocode_address("Klostergatan 11, Stockholm")
    assert (place.latitude, place.longitude) == (59.33, 18.06)
    assert place.precision == "rooftop"
    assert 0 < place.radius_meters < 200


def test_a_city_hit_is_a_large_circle(google):
    # ~0.15 degrees is a city-sized box.
    google["value"] = _result(59.33, 18.06, "APPROXIMATE", 0.15)
    place = geocode_address("Stockholm, Sverige")
    assert place.precision == "approximate"
    assert place.radius_meters > 10_000


def test_the_circle_covers_the_whole_box(google):
    """Half the diagonal, not half a side -- a corner must fall inside."""
    google["value"] = _result(0.0, 0.0, "APPROXIMATE", 0.1)
    place = geocode_address("somewhere")
    # One degree of latitude is ~111 km, so the corner is ~15.7 km away.
    assert 15_000 < place.radius_meters < 16_500


def test_a_result_without_a_viewport_still_gives_a_point(google):
    google["value"] = [{"geometry": {"location": {"lat": 1.5, "lng": 2.5}}}]
    place = geocode_address("sparse")
    assert (place.latitude, place.longitude) == (1.5, 2.5)
    assert place.radius_meters is None
    assert place.precision is None


def test_no_result_is_none(google):
    google["value"] = []
    assert geocode_address("nowhere") is None


def test_coordinates_are_read_by_name(google):
    """Four fields, so there is no unpacking into a pair to get wrong."""
    google["value"] = _result(59.33, 18.06, "ROOFTOP", 0.0005)
    place = geocode_address("Klostergatan 11")
    assert place.latitude == 59.33
    assert place.longitude == 18.06


def test_a_missing_key_means_no_call(monkeypatch):
    monkeypatch.setattr(g, "GOOGLE_GEOCODING_API_KEY", "")
    assert geocode_address("Stockholm") is None


def test_a_geocoder_blowup_is_not_an_exception(google, monkeypatch):
    class Boom:
        def geocode(self, address):
            raise RuntimeError("down")

    monkeypatch.setattr(g, "gmaps", Boom(), raising=False)
    assert geocode_address("Stockholm") is None


def test_place_is_hashable_and_comparable():
    a = GeocodedPlace(1.0, 2.0, 50, "rooftop")
    b = GeocodedPlace(1.0, 2.0, 50, "rooftop")
    assert a == b
