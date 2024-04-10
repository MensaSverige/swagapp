import json
from typing import Optional
from pydantic import ValidationError
from db.models.user import ContactInfo, ShowLocation, User, UserSettings
from db.mongo import user_collection  

def get_user(user_id: int) -> User:
    """
    Retrieves a user document from the MongoDB database.

    :param user_id: The user ID.
    :param db: The MongoDB database object.
    :return: The user document.
    """

    return user_collection.find_one({"userId": user_id})

def create_user(response_json: dict) -> User:
    """
    Creates a new user document in the MongoDB database

    :param user: The user document.
    :param db: The MongoDB database object.
    :return: The user document.
    """
    newuser = map_authresponse_to_user(response_json)
    user_collection.insert_one(newuser)
    return newuser

def get_users(show_location: Optional[bool] = None) -> list[User]:
    """
    Retrieves all user documents from the MongoDB database.

    :param show_location: The show_location flag to filter users by.
    :return: The user documents.
    """
    query = {}
    if show_location is not None:
        query['show_location'] = show_location

    return list(user_collection.find(query))

def map_authresponse_to_user(response_json: dict) -> User:
    user = User(
        userId=response_json["memberId"],
        isMember=response_json["type"] == "M",
        settings=UserSettings(show_location=ShowLocation.no_one, show_contact_info=False),  # Default values
    )

    if user.isMember:
        user.firstName = response_json.get("firstName", None)
        user.lastName = response_json.get("lastName", None)
        user.contact_info = ContactInfo(email=response_json.get("email", None), phone=None)  # Update email

    try:
        user_json = json.dumps(user.dict())
        User.model_validate_json(user_json)
        return user.dict()
    except ValidationError:
        return None
