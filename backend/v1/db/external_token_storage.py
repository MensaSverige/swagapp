"""
This module contains functions for saving and retrieving external tokens in a MongoDB collection.

The `save_external_token` function saves an external token for a user in the collection. 
It takes a user ID, an external token, and an expiration datetime as arguments. The function first 
converts the current time and the expiration datetime to timezone-aware datetime objects, 
because MongoDB requires datetime objects to be timezone-aware. It then creates a new document 
with the user ID, the external token, and the timezone-aware datetimes, and upserts it into the collection.

The `get_external_token` function retrieves the external token for a user from the collection. It takes a 
user ID as an argument, and returns the document for the user from the collection. The function also converts 
the `createdAt` and `expiresAt` fields in the document to timezone-aware datetime objects, because 
MongoDB returns these fields as naive datetime objects.

The `convert_to_tz_aware` function is used to convert a naive datetime object to a timezone-aware datetime object. 
It takes a naive datetime object as an argument, and returns a timezone-aware datetime object in the same timezone 
as the current time.

The `get_current_time` function returns the current time as a timezone-aware datetime object.
"""
from datetime import datetime
from db.models.tokenstorage import TokenStorage
from db.mongo import tokenstorage_collection
from utilities import convert_to_tz_aware, get_current_time

def save_external_token(user_id: int, external_token: str, expires_at: datetime):
    token = TokenStorage.model_validate({
        "userId": user_id,
        "externalAccessToken": external_token,
        "createdAt": convert_to_tz_aware(get_current_time()),
        "expiresAt": convert_to_tz_aware(expires_at)
    })

    tokenjson = token.model_dump()

    # Upsert option to ensure no duplicate entries for the same user
    tokenstorage_collection.update_one(
        {"userId": tokenjson["userId"]},
        {"$set": tokenjson},
        upsert=True
    )

def get_external_token(user_id: int):
    token_info = tokenstorage_collection.find_one({"userId": user_id})
    if not token_info:
        # TODO: Token is expired or not found, request new token
        return None
    
    expires_at_tz_aware = convert_to_tz_aware(token_info['expiresAt'])
    created_at_tz_aware = convert_to_tz_aware(token_info['createdAt'])
    
    if expires_at_tz_aware > get_current_time():
        return token_info['externalAccessToken']
