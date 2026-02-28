import json
from typing import Optional
from pydantic import ValidationError
from v1.db.models.user import ContactInfo, ShowLocation, User, UserSettings
from v1.db.database import SessionLocal
from v1.db.tables import UserTable


def get_user(user_id: int) -> dict | None:
    """
    Retrieves a user from the database.

    :param user_id: The user ID.
    :return: The user dict or None.
    """
    with SessionLocal() as session:
        row = session.query(UserTable).filter_by(userId=user_id).first()
        return row.to_dict() if row else None


def update_user(user_id: int, user: dict) -> dict:
    """
    Updates a user in the database.

    :param user_id: The user ID.
    :param user: The user data as a dict.
    :return: The user data.
    """
    with SessionLocal() as session:
        row = session.query(UserTable).filter_by(userId=user_id).first()
        if not row:
            return user

        # Flatten nested dicts for column assignment
        if isinstance(user, dict):
            data = user
        else:
            data = user if isinstance(user, dict) else dict(user)

        # Top-level fields
        for key in ("isMember", "age", "slogan", "avatar_url", "firstName", "lastName"):
            if key in data:
                setattr(row, key, data[key])

        # Settings
        settings = data.get("settings")
        if settings:
            row.show_location = settings.get("show_location", row.show_location)
            row.show_email = settings.get("show_email", row.show_email)
            row.show_phone = settings.get("show_phone", row.show_phone)
            row.location_update_interval_seconds = settings.get("location_update_interval_seconds", row.location_update_interval_seconds)
            row.events_refresh_interval_seconds = settings.get("events_refresh_interval_seconds", row.events_refresh_interval_seconds)
            row.background_location_updates = settings.get("background_location_updates", row.background_location_updates)

        # Location
        location = data.get("location")
        if location is not None:
            row.location_latitude = location.get("latitude")
            row.location_longitude = location.get("longitude")
            row.location_timestamp = location.get("timestamp")
            row.location_accuracy = location.get("accuracy")
        elif "location" in data and data["location"] is None:
            row.location_latitude = None
            row.location_longitude = None
            row.location_timestamp = None
            row.location_accuracy = None

        # Contact info
        contact = data.get("contact_info")
        if contact is not None:
            row.contact_email = contact.get("email")
            row.contact_phone = contact.get("phone")

        session.commit()
    return user


def create_user(response_json: dict) -> dict | None:
    """
    Creates a new user in the database.

    :param response_json: The auth response JSON.
    :return: The user dict.
    """
    newuser = map_authresponse_to_user(response_json)
    if newuser is None:
        return None

    user_model = User(**newuser) if isinstance(newuser, dict) else newuser
    with SessionLocal() as session:
        row = UserTable.from_pydantic(user_model)
        session.add(row)
        session.commit()
    return newuser


def get_users(show_location: Optional[bool] = None) -> list[dict]:
    """
    Retrieves all users from the database.

    :param show_location: If True, filter to users who share their location.
    :return: List of user dicts.
    """
    with SessionLocal() as session:
        query = session.query(UserTable)
        if show_location is not None:
            query = query.filter(UserTable.show_location != ShowLocation.NO_ONE.value)
        rows = query.all()
        return [row.to_dict() for row in rows]


def get_users_by_ids(user_ids: list[int]) -> list[dict]:
    if not user_ids:
        return []
    with SessionLocal() as session:
        rows = session.query(UserTable).filter(UserTable.userId.in_(user_ids)).all()
        return [row.to_dict() for row in rows]


def get_users_showing_location() -> list[dict]:
    """
    Retrieves all users who share their location.

    :return: List of user dicts.
    """
    with SessionLocal() as session:
        rows = session.query(UserTable).filter(
            UserTable.show_location != ShowLocation.NO_ONE.value
        ).all()
        return [row.to_dict() for row in rows]


def update_user_from_authresponse(user_id: int, response_json: dict) -> None:
    with SessionLocal() as session:
        row = session.query(UserTable).filter_by(userId=user_id).first()
        if not row:
            return
        row.firstName = response_json.get("firstName", row.firstName)
        row.lastName = response_json.get("lastName", row.lastName)
        row.contact_email = response_json.get("email", row.contact_email)
        row.isMember = response_json.get("type") == "M"
        session.commit()


def map_authresponse_to_user(response_json: dict) -> dict | None:
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
