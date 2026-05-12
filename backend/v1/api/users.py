import logging
import shutil
import os
from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from v1.utilities import convert_to_tz_aware, get_current_time
from v1.db.models.user import User, UserLocation, UserUpdate, PrivacySetting
from v1.request_filter import validate_request
from v1.db.users import get_users as db_get_users, get_user, get_users_showing_location, update_user

users_v1 = APIRouter(prefix="/v1")


def _viewer_can_see(target_setting: str, viewer: dict | None, setting_key: str) -> bool:
    viewer_is_member = viewer is not None and viewer.get("isMember", False)
    viewer_own = (viewer or {}).get("settings", {}).get(setting_key, PrivacySetting.NO_ONE.value)
    viewer_is_mutual = viewer_own != PrivacySetting.NO_ONE.value
    viewer_is_everyone_mutual = viewer_own in [PrivacySetting.EVERYONE_MUTUAL.value, PrivacySetting.EVERYONE.value]

    if target_setting == PrivacySetting.NO_ONE.value:
        return False
    elif target_setting == PrivacySetting.EVERYONE.value:
        return True
    elif target_setting == PrivacySetting.EVERYONE_MUTUAL.value:
        return viewer_is_everyone_mutual
    elif target_setting == PrivacySetting.MEMBERS_ONLY.value:
        return viewer_is_member
    elif target_setting == PrivacySetting.MEMBERS_MUTUAL.value:
        return viewer_is_member and viewer_is_mutual
    return viewer_is_member


@users_v1.get("/users", response_model=List[User])
async def get_users(show_location: bool = None,
                    current_user: dict = Depends(validate_request)):
    if show_location:
        users_list = get_users_showing_location()
    else:
        raise HTTPException(
            status_code=400,
            detail="show_location parameter must be set to True to retrieve users."
        )
        users_list = db_get_users()
    # Enforce privacy: hide email/phone/location if disabled, filter by profile visibility
    result = []
    for user in users_list:
        settings = user.get("settings", {})
        # ensure contact_info dict exists
        contact = user.get("contact_info") or {}
        if not _viewer_can_see(settings.get("show_email", PrivacySetting.NO_ONE.value), current_user, "show_email"):
            contact["email"] = None
        if not _viewer_can_see(settings.get("show_phone", PrivacySetting.NO_ONE.value), current_user, "show_phone"):
            contact["phone"] = None
        user["contact_info"] = contact
        if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
                settings.get("show_location", PrivacySetting.NO_ONE.value), current_user, "show_location"):
            user["location"] = None
        if not _viewer_can_see(settings.get("show_interests", PrivacySetting.MEMBERS_ONLY.value), current_user, "show_interests") and user.get("userId") != current_user.get("userId"):
            user["interests"] = []
        if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
                settings.get("show_hometown", PrivacySetting.MEMBERS_ONLY.value), current_user, "show_hometown"):
            user["hometown"] = None
        if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
                settings.get("show_birthdate", PrivacySetting.MEMBERS_ONLY.value), current_user, "show_birthdate"):
            user["birthdate"] = None
        if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
                settings.get("show_gender", PrivacySetting.NO_ONE.value), current_user, "show_gender"):
            user["gender"] = None
        if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
                settings.get("show_sexuality", PrivacySetting.NO_ONE.value), current_user, "show_sexuality"):
            user["sexuality"] = None
        if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
                settings.get("show_relationship_style", PrivacySetting.NO_ONE.value), current_user, "show_relationship_style"):
            user["relationship_style"] = None
        if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
                settings.get("show_relationship_status", PrivacySetting.NO_ONE.value), current_user, "show_relationship_status"):
            user["relationship_status"] = None
        if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
                settings.get("show_social_flags", PrivacySetting.MEMBERS_ONLY.value), current_user, "show_social_flags"):
            user["social_flags"] = []
        if user.get("userId") == current_user.get("userId") or _viewer_can_see(
                settings.get("show_profile", PrivacySetting.MEMBERS_ONLY.value), current_user, "show_profile"):
            result.append(user)
    return result


@users_v1.get("/users/{user_id}", response_model=User)
async def get_user_by_id(user_id: int,
                         current_user: dict = Depends(validate_request)):
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    settings = user.get("settings", {})
    if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
            settings.get("show_profile", PrivacySetting.MEMBERS_ONLY.value), current_user, "show_profile"):
        raise HTTPException(status_code=403, detail="Profile not visible")

    # Enforce privacy: hide email/phone based on viewer's access
    contact = user.get("contact_info") or {}
    if not _viewer_can_see(settings.get("show_email", PrivacySetting.NO_ONE.value), current_user, "show_email"):
        contact["email"] = None
    if not _viewer_can_see(settings.get("show_phone", PrivacySetting.NO_ONE.value), current_user, "show_phone"):
        contact["phone"] = None
    user["contact_info"] = contact

    # Hide location if user doesn't want to show it
    if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
            settings.get("show_location", PrivacySetting.NO_ONE.value), current_user, "show_location"):
        user["location"] = None

    if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
            settings.get("show_interests", PrivacySetting.MEMBERS_ONLY.value), current_user, "show_interests"):
        user["interests"] = []

    if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
            settings.get("show_hometown", PrivacySetting.MEMBERS_ONLY.value), current_user, "show_hometown"):
        user["hometown"] = None
    if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
            settings.get("show_birthdate", PrivacySetting.MEMBERS_ONLY.value), current_user, "show_birthdate"):
        user["birthdate"] = None
    if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
            settings.get("show_gender", PrivacySetting.NO_ONE.value), current_user, "show_gender"):
        user["gender"] = None
    if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
            settings.get("show_sexuality", PrivacySetting.NO_ONE.value), current_user, "show_sexuality"):
        user["sexuality"] = None
    if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
            settings.get("show_relationship_style", PrivacySetting.NO_ONE.value), current_user, "show_relationship_style"):
        user["relationship_style"] = None
    if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
            settings.get("show_relationship_status", PrivacySetting.NO_ONE.value), current_user, "show_relationship_status"):
        user["relationship_status"] = None
    if user.get("userId") != current_user.get("userId") and not _viewer_can_see(
            settings.get("show_social_flags", PrivacySetting.MEMBERS_ONLY.value), current_user, "show_social_flags"):
        user["social_flags"] = []

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
    if 'settings' in update_dict:
        existing_settings = current_user.get('settings', {})
        update_dict['settings'] = {**existing_settings, **update_dict['settings']}
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
