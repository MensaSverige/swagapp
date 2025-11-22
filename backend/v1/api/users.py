import logging
import shutil
import os
from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from v1.utilities import convert_to_tz_aware, get_current_time
from v1.db.models.user import User, UserLocation, UserUpdate
from v1.request_filter import validate_request
from v1.db.users import get_users as db_get_users, get_user, get_users_showing_location, update_user, ShowLocation

users_v1 = APIRouter(prefix="/v1")


@users_v1.get("/users", response_model=List[User])
async def get_users(show_location: bool = None,
                    _: dict = Depends(validate_request)):
    if show_location:
        users_list = get_users_showing_location()
    else:
        raise HTTPException(
            status_code=400,
            detail="show_location parameter must be set to True to retrieve users."
        )
        users_list = db_get_users()
    # Enforce privacy: hide email/phone if disabled
    for user in users_list:
        settings = user.get("settings", {})
        # ensure contact_info dict exists
        contact = user.get("contact_info") or {}
        if not settings.get("show_email"):
            contact["email"] = None
        if not settings.get("show_phone"):
            contact["phone"] = None
        user["contact_info"] = contact
        if not settings.get("show_location") or settings.get("show_location") == ShowLocation.NO_ONE:
            user["location"] = None
    return users_list


@users_v1.get("/users/{user_id}", response_model=User)
async def get_user_by_id(user_id: int,
                         _: dict = Depends(validate_request)):
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Enforce privacy: hide email/phone if disabled
    settings = user.get("settings", {})
    contact = user.get("contact_info") or {}
    if not settings.get("show_email"):
        contact["email"] = None
    if not settings.get("show_phone"):
        contact["phone"] = None
    user["contact_info"] = contact
    
    # Hide location if user doesn't want to show it
    if not settings.get("show_location") or settings.get("show_location") == ShowLocation.NO_ONE:
        user["location"] = None
    
    return user


@users_v1.put("/users/me/location", response_model=User)
async def update_user_location(location: UserLocation,
                               current_user: dict = Depends(validate_request)):
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
                             current_user: User = Depends(validate_request)):
    logging.info(f"file: {file.filename}")
    logging.info(f"current_user: {current_user}")
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in [".jpg", ".jpeg", ".png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG and PNG are allowed.")
    current_timestamp = int(get_current_time().timestamp())
    file_path = f"/static/img/{current_user['userId']}_avatar_{current_timestamp}{file_extension}"
    logging.info(f"file_path: {file_path}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    current_user['avatar_url'] = file_path

    # Keep the three most recent avatar files, delete older ones
    keep = [file_path]
    user_id_prefix = f"/static/img/{current_user['userId']}_avatar_"
    for fname in os.listdir("/static/img/"):
        if fname.startswith(f"{current_user['userId']}_avatar_"):
            full_path = os.path.join("/static/img/", fname)
            if full_path != file_path:
                keep.append(full_path)
    keep = sorted(keep, reverse=True)[:3]  # Keep only the three most recent
    for fname in os.listdir("/static/img/"):
        if fname.startswith(f"{current_user['userId']}_avatar_"):
            full_path = os.path.join("/static/img/", fname)
            if full_path not in keep:
                os.remove(full_path)
                logging.info(f"Deleted old avatar file: {full_path}")

    return update_user(current_user['userId'], current_user)
