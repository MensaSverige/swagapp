
from http.client import HTTPException
import logging
from fastapi import APIRouter, Depends
import googlemaps
from v1.google_maps_api.geolocation_model import GeoLocation
from v1.request_filter import validate_request
from v1.env_constants import GOOGLE_MAPS_API_KEY


geolocation_v1 = APIRouter(prefix="/v1")

if GOOGLE_MAPS_API_KEY and GOOGLE_MAPS_API_KEY == "":
    gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)

@geolocation_v1.get("/geolocation/{address}")
def getLocationByAdress(address : str, current_user: dict = Depends(validate_request)) -> GeoLocation:
    if not GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY == "":
        raise HTTPException(status_code=500, detail="Google Maps API key is not configured")
    
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