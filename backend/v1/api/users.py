import logging
from typing import List
from fastapi import APIRouter, Depends
from utilities import get_current_time
from db.models.user import User, UserLocation, UserUpdate
from request_filter import validate_request
from db.users import get_user,  get_users_showing_location, update_user

users_v1 = APIRouter(prefix="/v1")

@users_v1.get("/users/{user_id}")
async def get_user_by_id(user_id: int):
    user = get_user(user_id)
    return user

@users_v1.get("/users", response_model=List[User])
async def get_users(show_location: bool = None):
    if show_location:
        return get_users_showing_location()
    return get_users()


@users_v1.put("/users/me/location", response_model=User)
async def update_user_location(location: UserLocation, current_user: dict = Depends(validate_request)):
    logging.info(f"location: {location}")
    update_dict = location.model_dump(exclude_unset=True)
    update_dict['timestamp'] = get_current_time()  # Set timestamp to current time
    current_user['location'] = update_dict

    return update_user(current_user['userId'], current_user)

@users_v1.get("/users/me/", response_model=User)
async def get_current_user(current_user: User = Depends(validate_request)):
    return current_user

@users_v1.put("/users/me", response_model=User)
async def update_current_user(user_update: UserUpdate, current_user: User = Depends(validate_request)):
    update_dict = user_update.model_dump(exclude_unset=True)
    current_user.update(update_dict)

    return update_user(current_user['userId'], current_user)