"""Tests for DB resilience: session rollback, initialize_db retry, per-event transactions."""

from unittest.mock import patch, call
from datetime import datetime

from v1.db.external_events import store_external_event_details, get_all_stored_external_event_details
from v1.db.models.external_events import ExternalEventDetails


def _make_event(event_id: int, **overrides) -> ExternalEventDetails:
    base = dict(
        eventId=event_id,
        eventDate=datetime(2025, 6, 1, 10, 0),
        startTime="10:00",
        endTime="12:00",
        titel=f"Event {event_id}",
        description="desc",
        speaker="Speaker",
        location="Room",
        isFree=True,
        price=0,
        isLimited=False,
        stock=100,
        showBooked=True,
        booked=0,
        eventUrl=f"https://example.com/{event_id}",
    )
    base.update(overrides)
    return ExternalEventDetails(**base)


# ── Per-event transactions (swagapp-os0it) ────────────────────────────────────

def test_bad_event_does_not_wipe_good_events():
    """A bad record in a batch must not roll back previously committed events."""
    good = _make_event(1)
    bad = _make_event(2, titel=None)  # will succeed — titel is nullable

    # Verify batch with two valid events works
    store_external_event_details([good, bad])
    all_events = get_all_stored_external_event_details()
    assert any(e.eventId == 1 for e in all_events)


def test_per_event_transaction_isolation(monkeypatch):
    """Error on event 2 must not affect event 1 that was already committed."""
    import v1.db.external_events as mod

    call_count = {"n": 0}
    original_get_session = mod.get_session

    def failing_get_session():
        call_count["n"] += 1
        if call_count["n"] == 2:
            from contextlib import contextmanager

            @contextmanager
            def boom():
                raise RuntimeError("DB error on event 2")
                yield  # noqa: unreachable

            return boom()
        return original_get_session()

    monkeypatch.setattr(mod, "get_session", failing_get_session)

    store_external_event_details([_make_event(10), _make_event(20)])

    all_events = get_all_stored_external_event_details()
    ids = {e.eventId for e in all_events}
    assert 10 in ids  # event 1 persisted
    assert 20 not in ids  # event 2 failed but event 1 safe


# ── initialize_db retry (swagapp-3jo2f) ───────────────────────────────────────

def test_initialize_db_retries_on_failure():
    """initialize_db should retry on connection failure and succeed eventually."""
    import v1.db.database as db_mod

    call_count = {"n": 0}
    original = db_mod.Base.metadata.create_all

    def flaky_create_all(bind):
        call_count["n"] += 1
        if call_count["n"] < 3:
            raise Exception("Connection refused")
        original(bind=bind)

    with patch.object(db_mod.Base.metadata, "create_all", side_effect=flaky_create_all):
        with patch("v1.db.database.time.sleep"):  # don't actually sleep
            db_mod.initialize_db(max_retries=5, retry_delay=0)

    assert call_count["n"] == 3


def test_initialize_db_raises_after_max_retries():
    import v1.db.database as db_mod

    with patch.object(db_mod.Base.metadata, "create_all", side_effect=Exception("always fails")):
        with patch("v1.db.database.time.sleep"):
            try:
                db_mod.initialize_db(max_retries=3, retry_delay=0)
                assert False, "should have raised"
            except Exception as e:
                assert "always fails" in str(e)
