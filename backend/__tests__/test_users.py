"""Tests for user DB operations."""

from v1.db.users import (
    create_user, get_user, update_user, get_users,
    get_users_showing_location, update_user_from_authresponse,
)


def _make_auth_response(**overrides):
    base = {
        "memberId": 1001,
        "type": "M",
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
    }
    base.update(overrides)
    return base


def test_create_and_get_user():
    auth = _make_auth_response()
    result = create_user(auth)
    assert result is not None
    assert result["userId"] == 1001
    assert result["isMember"] is True

    fetched = get_user(1001)
    assert fetched is not None
    assert fetched["userId"] == 1001
    assert fetched["firstName"] == "Test"
    assert fetched["lastName"] == "User"


def test_get_nonexistent_user():
    assert get_user(9999) is None


def test_update_user_profile():
    create_user(_make_auth_response())
    assert get_user(1001)["slogan"] is None

    update_user(1001, {"slogan": "Hello world"})
    assert get_user(1001)["slogan"] == "Hello world"


def test_update_user_settings_privacy():
    create_user(_make_auth_response())
    update_user(1001, {
        "settings": {
            "show_location": "EVERYONE",
            "show_email": "MEMBERS_ONLY",
            "show_phone": "NO_ONE",
            "location_update_interval_seconds": 30,
            "events_refresh_interval_seconds": 30,
            "background_location_updates": True,
        }
    })
    fetched = get_user(1001)
    assert fetched["settings"]["show_location"] == "EVERYONE"
    assert fetched["settings"]["show_email"] == "MEMBERS_ONLY"
    assert fetched["settings"]["show_phone"] == "NO_ONE"
    assert fetched["settings"]["location_update_interval_seconds"] == 30


def test_privacy_setting_round_trip_all_values():
    """All PrivacySetting values survive a write/read round-trip."""
    create_user(_make_auth_response())
    for value in ("NO_ONE", "MEMBERS_ONLY", "MEMBERS_MUTUAL", "EVERYONE_MUTUAL", "EVERYONE"):
        update_user(1001, {"settings": {"show_email": value}})
        assert get_user(1001)["settings"]["show_email"] == value


def test_update_user_location():
    create_user(_make_auth_response())
    update_user(1001, {
        "location": {
            "latitude": 59.33,
            "longitude": 18.07,
            "timestamp": None,
            "accuracy": 5.0,
        }
    })
    fetched = get_user(1001)
    assert fetched["location"] is not None
    assert fetched["location"]["latitude"] == 59.33

    update_user(1001, {"location": None})
    assert get_user(1001)["location"] is None


def test_update_user_contact_info():
    create_user(_make_auth_response())
    update_user(1001, {
        "contact_info": {"email": "new@example.com", "phone": "+46701234567"}
    })
    fetched = get_user(1001)
    assert fetched["contact_info"]["email"] == "new@example.com"
    assert fetched["contact_info"]["phone"] == "+46701234567"


def test_update_user_profile_fields():
    """interests, hometown, birthdate and other profile fields persist."""
    create_user(_make_auth_response())
    update_user(1001, {
        "interests": ["Böcker och litteratur"],
        "hometown": "Stockholm",
        "birthdate": "1989-11-15",
        "gender": "male",
        "sexuality": "straight",
        "relationship_style": "monogamous",
        "relationship_status": "has_partner",
        "social_vibes": ["social"],
        "pronomen": "hen",
    })
    fetched = get_user(1001)
    assert fetched["hometown"] == "Stockholm"
    assert fetched["birthdate"] == "1989-11-15"
    assert fetched["gender"] == "male"
    assert fetched["pronomen"] == "hen"
    assert fetched["interests"] == ["Böcker och litteratur"]
    assert fetched["social_vibes"] == ["social"]


def test_get_users_all():
    create_user(_make_auth_response(memberId=1001))
    create_user(_make_auth_response(memberId=1002, firstName="Other"))
    assert len(get_users()) == 2


def test_get_users_showing_location():
    create_user(_make_auth_response(memberId=1001))
    create_user(_make_auth_response(memberId=1002))

    assert len(get_users_showing_location()) == 0

    update_user(1001, {"settings": {
        "show_location": "EVERYONE",
        "show_email": "NO_ONE",
        "show_phone": "NO_ONE",
        "location_update_interval_seconds": 60,
        "events_refresh_interval_seconds": 60,
        "background_location_updates": False,
    }})
    assert len(get_users_showing_location()) == 1


def test_update_user_from_authresponse_updates_fields():
    create_user(_make_auth_response())
    update_user_from_authresponse(1001, {
        "firstName": "Updated",
        "lastName": "Name",
        "email": "updated@example.com",
        "type": "M",
    })
    fetched = get_user(1001)
    assert fetched["firstName"] == "Updated"
    assert fetched["isMember"] is True


def test_update_user_from_authresponse_absent_type_does_not_demote():
    """Missing 'type' key must not change isMember."""
    create_user(_make_auth_response())
    assert get_user(1001)["isMember"] is True

    update_user_from_authresponse(1001, {"firstName": "NoType"})
    assert get_user(1001)["isMember"] is True


def test_update_user_from_authresponse_nonexistent_user():
    # Should not raise
    update_user_from_authresponse(9999, {"firstName": "Ghost", "type": "M"})


# ── partial locations ─────────────────────────────────────────────────────────
# UserLocation.accuracy used to be a required float while the column is
# nullable, and mongo_to_postgres passes `loc.get("accuracy")` straight
# through. One migrated row without it raised
#
#   ValidationError: user.location.accuracy — Input should be a valid number
#
# on that user's own login *and* on /v1/users for every member, because the
# list builds List[User] and one bad row fails the whole response. These pin
# the shapes the database can actually produce.

def _user_with_location(**loc_overrides):
    create_user(_make_auth_response())
    loc = {"latitude": 59.33, "longitude": 18.07, "timestamp": None, "accuracy": 5.0}
    loc.update(loc_overrides)
    update_user(1001, {"location": loc})
    return get_user(1001)


def test_location_without_accuracy_is_readable():
    """What the Mongo migration produces for a document that never had it."""
    from v1.db.database import get_session
    from v1.db.tables import UserTable

    _user_with_location()
    with get_session() as session:
        session.query(UserTable).filter_by(userId=1001).update({"location_accuracy": None})
        session.commit()

    fetched = get_user(1001)
    assert fetched["location"] is not None
    assert fetched["location"]["accuracy"] is None
    assert fetched["location"]["latitude"] == 59.33


def test_user_model_validates_location_without_accuracy():
    """The response models must accept it — this is where the 500 came from."""
    from v1.db.models.user import User

    from v1.db.database import get_session
    from v1.db.tables import UserTable

    _user_with_location()
    with get_session() as session:
        session.query(UserTable).filter_by(userId=1001).update({"location_accuracy": None})
        session.commit()

    User(**get_user(1001))  # must not raise


def test_half_written_location_is_not_returned():
    """Latitude without longitude cannot satisfy UserLocation, so omit it.

    Emitting it would fail validation for every consumer of that row rather
    than just degrading one field.
    """
    from v1.db.database import get_session
    from v1.db.tables import UserTable

    _user_with_location()
    with get_session() as session:
        session.query(UserTable).filter_by(userId=1001).update({"location_longitude": None})
        session.commit()

    assert get_user(1001)["location"] is None


def test_one_unreadable_location_does_not_break_the_user_list():
    """get_users_showing_location builds a list; one bad row used to fail it all."""
    from v1.db.database import get_session
    from v1.db.tables import UserTable
    from v1.db.models.user import User

    create_user(_make_auth_response(memberId=2002, email="other@example.com"))
    update_user(2002, {"settings": {"show_location": "EVERYONE"}})
    update_user(2002, {"location": {"latitude": 57.7, "longitude": 11.9,
                                    "timestamp": None, "accuracy": 3.0}})

    _user_with_location()
    update_user(1001, {"settings": {"show_location": "EVERYONE"}})
    with get_session() as session:
        session.query(UserTable).filter_by(userId=1001).update({"location_accuracy": None})
        session.commit()

    users = get_users_showing_location()
    for u in users:
        User(**u)  # every row must validate
    assert len(users) >= 2


# ── tolerating what MongoDB actually stored ───────────────────────────────────
# These fields are strict enums in the response model but were never constrained
# in Mongo, so migrated rows carry legacy and retired values. A single such row
# used to fail validation for the *whole* /v1/users response — hiding every
# member from the map. Found by dry-running the migration against seeded data.

def test_legacy_privacy_values_are_renamed_on_every_field():
    """The rename was only applied to show_location, not the other ten."""
    from v1.db.models.user import UserSettings

    s = UserSettings(
        show_location="ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION",
        show_profile="ALL_MEMBERS",
    )
    assert s.show_location.value == "MEMBERS_MUTUAL"
    assert s.show_profile.value == "MEMBERS_ONLY"


def test_unknown_privacy_value_falls_back_to_the_most_restrictive():
    """An unrecognised setting must not fail the response — nor leak.

    Guessing wrong in the permissive direction would expose a profile the
    member may have chosen to hide, so the fallback is NO_ONE rather than the
    field's default.
    """
    from v1.db.models.user import UserSettings

    s = UserSettings(show_gender="SOMETHING_WE_RETIRED")
    assert s.show_gender.value == "NO_ONE"


def test_boolean_privacy_values_still_coerce():
    """Pre-enum data stored show_email/show_phone as booleans."""
    from v1.db.models.user import UserSettings

    s = UserSettings(show_email=True, show_phone=False)
    assert s.show_email.value == "MEMBERS_ONLY"
    assert s.show_phone.value == "NO_ONE"


def test_retired_interests_are_dropped_not_fatal():
    """interests is List[UserInterest]; Mongo holds whatever was valid then."""
    from v1.db.models.user import User

    u = User(userId=1, isMember=True, settings={},
             interests=["Konst", "Schack", "Matematik"])
    # "Schack" is not in the enum; the two that are must survive.
    assert [i.value for i in u.interests] == ["Konst", "Matematik"]


def test_one_bad_row_does_not_fail_the_whole_user_list():
    """The failure mode that matters: a list response is all-or-nothing."""
    from v1.db.models.user import User

    rows = [
        {"userId": 1, "isMember": True, "settings": {}, "interests": ["Konst"]},
        {"userId": 2, "isMember": True, "interests": ["Schack"],
         "settings": {"show_profile": "ALL_MEMBERS"}},
        {"userId": 3, "isMember": True, "settings": {}},
    ]
    assert len([User(**r) for r in rows]) == 3

