import logging
import shutil
from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from v1.utilities import convert_to_tz_aware, get_current_time
from v1.db.models.user import User, UserLocation, UserUpdate
from v1.request_filter import validate_request, require_member
from v1.db.users import get_user, get_users_showing_location, update_user

users_v1 = APIRouter(prefix="/v1")


@users_v1.get("/users/{user_id}")
async def get_user_by_id(user_id: int):
    user = get_user(user_id)
    return user


@users_v1.get("/users", response_model=List[User])
async def get_users(show_location: bool = None,
                    _: dict = Depends(require_member)):
    if show_location:
        return get_users_showing_location()
    return get_users()


@users_v1.put("/users/me/location", response_model=User)
async def update_user_location(location: UserLocation,
                               current_user: dict = Depends(require_member)):
    logging.info(f"location: {location}")
    update_dict = location.model_dump(exclude_unset=True)
    update_dict['timestamp'] = convert_to_tz_aware(
        get_current_time())  # Set timestamp to current time
    current_user['location'] = update_dict

    return update_user(current_user['userId'], current_user)


@users_v1.get("/users/me", response_model=User)
async def get_current_user(current_user: User = Depends(validate_request)):
    return current_user


@users_v1.put("/users/me", response_model=User)
async def update_current_user(user_update: UserUpdate,
                              current_user: User = Depends(validate_request)):
    update_dict = user_update.model_dump(exclude_unset=True)
    current_user.update(update_dict)

    return update_user(current_user['userId'], current_user)


@users_v1.post("/users/me/avatar", response_model=User)
async def update_user_avatar(file: UploadFile = File(...),
                             current_user: User = Depends(require_member)):
    logging.info(f"file: {file.filename}")
    logging.info(f"current_user: {current_user}")
    file_path = f"/static/img/{current_user['userId']}_avatar.jpg"
    logging.info(f"file_path: {file_path}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    current_user['avatar_url'] = file_path

    return update_user(current_user['userId'], current_user)
