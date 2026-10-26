"""maxAttendees must fit the PostgreSQL INTEGER column it is stored in.

A larger value passed validation and then failed the INSERT, so the client
got a 500. It should be a 422 that says what is wrong.
"""

from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from v1.events.events_model import Event
from v1.user_events.user_events_model import UserEvent

_START = datetime(2026, 11, 1, 18, 0, tzinfo=timezone.utc)


def test_event_rejects_max_attendees_beyond_postgres_integer():
    with pytest.raises(ValidationError):
        Event(id="usr1", name="x", start=_START, official=False, maxAttendees=10**13)


def test_user_event_rejects_max_attendees_beyond_postgres_integer():
    with pytest.raises(ValidationError):
        UserEvent(userId=1, name="x", start=_START, maxAttendees=10**13)


def test_largest_postgres_integer_is_still_accepted():
    assert Event(id="usr1", name="x", start=_START, official=False, maxAttendees=2_147_483_647).maxAttendees == 2_147_483_647
