import json
from pymongo import MongoClient
import logging
from typing import Optional
from pydantic import BaseModel, ValidationError
from db.models.user import User
from sqlalchemy.orm import Session
from db.mongo import user_collection  

def get_user(user_id: int) -> User:
    """
    Retrieves a user document from the MongoDB database.

    :param user_id: The user ID.
    :param db: The MongoDB database object.
    :return: The user document.
    """

    return user_collection.find_one({'userId': user_id})

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
    user_dict = {
        "status": response_json["status"],
        "token": response_json["token"],
        "validThrough": response_json["validThrough"],
        "isMember": response_json["type"] == "M",
        "userId": response_json["memberId"],
    }

    if user_dict['isMember']:
        user_dict.update({
            "firstName": response_json.get("firstName", None),
            "lastName": response_json.get("lastName", None),
            "email": response_json.get("email", None),
        })
    try:
        user_json = json.dumps(user_dict)
        User.model_validate_json(json.dumps(user_dict))
        return user_dict
    except ValidationError:
        return None
