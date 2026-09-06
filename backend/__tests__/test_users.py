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
