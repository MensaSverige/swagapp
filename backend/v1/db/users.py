import json
from typing import Optional
from pydantic import ValidationError
from v1.db.models.user import ContactInfo, PrivacySetting, User, UserSettings
from v1.db.database import get_session
from v1.db.tables import UserTable


def get_user(user_id: int) -> dict | None:
    with get_session() as session:
        row = session.query(UserTable).filter_by(userId=user_id).first()
        return row.to_dict() if row else None


def update_user(user_id: int, user: dict) -> dict:
    with get_session() as session:
        row = session.query(UserTable).filter_by(userId=user_id).first()
        if not row:
            return user

        data = user if isinstance(user, dict) else dict(user)

        for key in ("isMember", "age", "slogan", "avatar_url", "firstName", "lastName",
                    "interests", "hometown", "birthdate", "gender", "sexuality",
                    "relationship_style", "relationship_status", "social_vibes", "pronomen"):
            if key in data:
                val = data[key]
                if key == "interests" and val is not None:
                    val = [i.value if hasattr(i, "value") else i for i in val]
                setattr(row, key, val)

        settings = data.get("settings")
        if settings:
            _bool_privacy_fields = {"show_email", "show_phone"}
            for field in ("show_location", "show_profile", "show_email", "show_phone",
                          "show_interests", "show_hometown", "show_birthdate", "show_gender",
                          "show_sexuality", "show_relationship_style", "show_relationship_status",
                          "show_social_vibes", "show_pronomen", "show_attendance",
                          "location_update_interval_seconds", "events_refresh_interval_seconds",
                          "background_location_updates"):
                if field in settings:
                    val = settings[field]
                    if hasattr(val, "value"):
                        val = val.value
                    # Coerce legacy boolean values for privacy fields
                    if field in _bool_privacy_fields and isinstance(val, bool):
                        val = "MEMBERS_ONLY" if val else "NO_ONE"
                    setattr(row, field, val)

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

        contact = data.get("contact_info")
        if contact is not None:
            row.contact_email = contact.get("email")
            row.contact_phone = contact.get("phone")

        session.commit()
    return user


def create_user(response_json: dict) -> dict | None:
    newuser = map_authresponse_to_user(response_json)
    if newuser is None:
        return None

    user_model = User(**newuser) if isinstance(newuser, dict) else newuser
    with get_session() as session:
        row = UserTable.from_pydantic(user_model)
        session.add(row)
        session.commit()
    return newuser


def get_users(show_location: Optional[bool] = None) -> list[dict]:
    with get_session() as session:
        query = session.query(UserTable)
        if show_location is not None:
            query = query.filter(UserTable.show_location != PrivacySetting.NO_ONE.value)
        rows = query.all()
        return [row.to_dict() for row in rows]


def get_users_by_ids(user_ids: list[int]) -> list[dict]:
    if not user_ids:
        return []
    with get_session() as session:
        rows = session.query(UserTable).filter(UserTable.userId.in_(user_ids)).all()
        return [row.to_dict() for row in rows]


def get_users_showing_location() -> list[dict]:
    with get_session() as session:
        rows = session.query(UserTable).filter(
            UserTable.show_location != PrivacySetting.NO_ONE.value
        ).all()
        return [row.to_dict() for row in rows]


def update_user_from_authresponse(user_id: int, response_json: dict) -> None:
    with get_session() as session:
        row = session.query(UserTable).filter_by(userId=user_id).first()
        if not row:
            return
        row.firstName = response_json.get("firstName", row.firstName)
        row.lastName = response_json.get("lastName", row.lastName)
        row.contact_email = response_json.get("email", row.contact_email)
        # Only set isMember if 'type' key is present; absent key must not demote
        if "type" in response_json:
            row.isMember = response_json["type"] == "M"
        session.commit()


def map_authresponse_to_user(response_json: dict) -> dict | None:
    user = User(
        userId=response_json["memberId"],
        isMember=response_json.get("type") == "M",
        settings=UserSettings(),
    )

    user.firstName = response_json.get("firstName", None)
    user.lastName = response_json.get("lastName", None)
    user.contact_info = ContactInfo(email=response_json.get("email", None), phone=None)

    try:
        user_json = json.dumps(user.model_dump())
        User.model_validate_json(user_json)
        return user.model_dump()
    except ValidationError:
        return None
