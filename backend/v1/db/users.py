import json
from typing import Optional
from pydantic import ValidationError
from v1.db.models.user import ContactInfo, ShowLocation, User, UserSettings
from v1.db.mongo import user_collection


def get_user(user_id: int) -> User:
    """
    Retrieves a user document from the MongoDB database.

    :param user_id: The user ID.
    :param db: The MongoDB database object.
    :return: The user document.
    """

    return user_collection.find_one({"userId": user_id})


def update_user(user_id: int, user: User) -> User:
    """
    Updates a user document in the MongoDB database.

    :param user_id: The user ID.
    :param user: The user document.
    :param db: The MongoDB database object.
    :return: The user document.
    """
    user_collection.update_one({"userId": user_id}, {"$set": user})
    return user


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
        query = {'settings.show_location': {'$ne': ShowLocation.NO_ONE.value}}
    return list(user_collection.find(query))


def get_users_showing_location() -> list[User]:
    """
    Retrieves all user documents from the MongoDB database where ShowLocation is not no_one.

    :return: The user documents.
    """
    query = {"settings.show_location": {"$ne": ShowLocation.NO_ONE.value}}
    return list(user_collection.find(query))


def map_authresponse_to_user(response_json: dict) -> User:
    user = User(
        userId=response_json["memberId"],
        isMember=response_json["type"] == "M",
        settings=UserSettings(),  # Default values
    )

    user.firstName = response_json.get("firstName", None)
    user.lastName = response_json.get("lastName", None)
    user.contact_info = ContactInfo(email=response_json.get("email", None),
                                    phone=None)  # Update email

    try:
        user_json = json.dumps(user.model_dump())
        User.model_validate_json(user_json)
        return user.model_dump()
    except ValidationError:
        return None
