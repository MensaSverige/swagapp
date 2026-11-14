
from http.client import HTTPException
import logging
import math
from typing import NamedTuple, Optional
from fastapi import APIRouter, Depends
import googlemaps
from v1.google_maps_api.geolocation_model import GeoLocation
from v1.request_filter import validate_request
from v1.env_constants import GOOGLE_GEOCODING_API_KEY


geolocation_v1 = APIRouter(prefix="/v1")

if GOOGLE_GEOCODING_API_KEY and GOOGLE_GEOCODING_API_KEY != "":
    gmaps = googlemaps.Client(key=GOOGLE_GEOCODING_API_KEY)

class GeocodedPlace(NamedTuple):
    """Where an address is, and how sure the geocoder was.

    A NamedTuple so `latitude, longitude = place` keeps reading naturally --
    the two extra fields are about how much to trust the point, not about
    where it is.

    `radius_meters` covers the box Google returned around the place: a
    rooftop hit is tens of metres, a city is tens of kilometres. It is None
    for the rare result carrying no viewport.

    `precision` is Google's own `location_type`, lowercased -- `rooftop`,
    `range_interpolated`, `geometric_center` or `approximate`. Not translated
    into words of our own, so there is nothing to drift.

    Docs: docs/Geocoding.md
    """

    latitude: float
    longitude: float
    radius_meters: Optional[int] = None
    precision: Optional[str] = None


_EARTH_RADIUS_METERS = 6_371_000


def _metres_between(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance, for turning a bounding box into a radius."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = phi2 - phi1
    d_lambda = math.radians(lng2 - lng1)
    a = (math.sin(d_phi / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2)
    return 2 * _EARTH_RADIUS_METERS * math.asin(min(1.0, math.sqrt(a)))


def _radius_meters(latitude: float, longitude: float, geometry: dict) -> Optional[int]:
    """The circle around the point that covers Google's viewport.

    The distance to a corner, not to an edge: a circle drawn to the edge
    leaves the corners of the box outside it, which would claim more
    precision than the geocoder gave.
    """
    viewport = geometry.get("viewport") or geometry.get("bounds")
    if not viewport:
        return None
    try:
        corner = viewport["northeast"]
        far = _metres_between(latitude, longitude,
                              float(corner["lat"]), float(corner["lng"]))
        other = viewport["southwest"]
        near = _metres_between(latitude, longitude,
                               float(other["lat"]), float(other["lng"]))
    except (KeyError, TypeError, ValueError):
        return None
    return round(max(far, near))


def geocode_address(address: str) -> Optional[GeocodedPlace]:
    """Best-effort geocode. Never raises; None when the address cannot be placed."""
    try:
        if not GOOGLE_GEOCODING_API_KEY or not address:
            return None
        client = globals().get("gmaps")
        if client is None:
            return None
        result = client.geocode(address)
        if not result:
            return None
        geometry = result[0]["geometry"]
        loc = geometry["location"]
        latitude, longitude = float(loc["lat"]), float(loc["lng"])
        location_type = geometry.get("location_type")
        return GeocodedPlace(
            latitude=latitude,
            longitude=longitude,
            radius_meters=_radius_meters(latitude, longitude, geometry),
            precision=location_type.lower() if location_type else None,
        )
    except Exception as e:
        logging.warning(f"Geocoding failed for {address!r}: {e}")
        return None


@geolocation_v1.get("/geolocation/{address}")
def getLocationByAdress(address : str, current_user: dict = Depends(validate_request)) -> GeoLocation:
    if not GOOGLE_GEOCODING_API_KEY or GOOGLE_GEOCODING_API_KEY == "":
        raise HTTPException(status_code=500, detail="Google Geocoding API key is not configured")
    
    # This function will get the location of the given address
    
    # Geocoding an address
    geocode_result = gmaps.geocode(address)

    # Check if geocode_result is empty
    if not geocode_result:
        raise HTTPException(status_code=404, detail="No geolocation data found for this address")

    logging.info(f"Geolocation found {geocode_result}")
    
    # Extract the formatted_address and location
    location = GeoLocation(
        formatted_address=geocode_result[0]['formatted_address'],
        latitude=geocode_result[0]['geometry']['location']['lat'],
        longitude=geocode_result[0]['geometry']['location']['lng']
    )

    logging.info(f"Location found {location}")
    return location