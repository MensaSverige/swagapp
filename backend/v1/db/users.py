import json
from pymongo import MongoClient
import logging
from typing import Type
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

def create_user(response_json: dict) -> None:
    """
    Creates a new user document in the MongoDB database

    :param user: The user document.
    :param db: The MongoDB database object.
    :return: The user document.
    """
    newuser = map_authresponse_to_user(response_json)
    user_collection.insert_one(newuser)

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
