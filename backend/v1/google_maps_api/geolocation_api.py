
from http.client import HTTPException
import logging
from typing import Optional
from fastapi import APIRouter, Depends
import googlemaps
from v1.google_maps_api.geolocation_model import GeoLocation
from v1.request_filter import validate_request
from v1.env_constants import GOOGLE_GEOCODING_API_KEY


geolocation_v1 = APIRouter(prefix="/v1")

if GOOGLE_GEOCODING_API_KEY and GOOGLE_GEOCODING_API_KEY != "":
    gmaps = googlemaps.Client(key=GOOGLE_GEOCODING_API_KEY)

def geocode_address(address: str) -> Optional[tuple[float, float]]:
    """Best-effort geocode to (lat, lng). Never raises; None on any failure."""
    try:
        if not GOOGLE_GEOCODING_API_KEY or not address:
            return None
        client = globals().get("gmaps")
        if client is None:
            return None
        result = client.geocode(address)
        if not result:
            return None
        loc = result[0]["geometry"]["location"]
        return float(loc["lat"]), float(loc["lng"])
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