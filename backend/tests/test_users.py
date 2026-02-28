"""Tests for user DB operations."""

from v1.db.users import create_user, get_user, update_user, get_users, get_users_showing_location


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
    fetched = get_user(1001)
    assert fetched["slogan"] is None

    update_user(1001, {"slogan": "Hello world"})
    fetched = get_user(1001)
    assert fetched["slogan"] == "Hello world"


def test_update_user_settings():
    create_user(_make_auth_response())
    update_user(1001, {
        "settings": {
            "show_location": "EVERYONE",
            "show_email": True,
            "show_phone": False,
            "location_update_interval_seconds": 30,
            "events_refresh_interval_seconds": 30,
            "background_location_updates": True,
        }
    })
    fetched = get_user(1001)
    assert fetched["settings"]["show_location"] == "EVERYONE"
    assert fetched["settings"]["show_email"] is True
    assert fetched["settings"]["location_update_interval_seconds"] == 30


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

    # Clear location
    update_user(1001, {"location": None})
    fetched = get_user(1001)
    assert fetched["location"] is None


def test_update_user_contact_info():
    create_user(_make_auth_response())
    update_user(1001, {
        "contact_info": {"email": "new@example.com", "phone": "+46701234567"}
    })
    fetched = get_user(1001)
    assert fetched["contact_info"]["email"] == "new@example.com"
    assert fetched["contact_info"]["phone"] == "+46701234567"


def test_get_users_all():
    create_user(_make_auth_response(memberId=1001))
    create_user(_make_auth_response(memberId=1002, firstName="Other"))
    users = get_users()
    assert len(users) == 2


def test_get_users_showing_location():
    create_user(_make_auth_response(memberId=1001))
    create_user(_make_auth_response(memberId=1002))

    # Default is NO_ONE, so no one should show
    assert len(get_users_showing_location()) == 0

    # Update one to share location
    update_user(1001, {"settings": {
        "show_location": "EVERYONE",
        "show_email": False,
        "show_phone": False,
        "location_update_interval_seconds": 60,
        "events_refresh_interval_seconds": 60,
        "background_location_updates": False,
    }})
    assert len(get_users_showing_location()) == 1
