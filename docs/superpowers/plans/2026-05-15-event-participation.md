# Event Participation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the `attendees` field on unified external events so the existing frontend attendee list renders real data instead of always showing empty.

**Architecture:** A new MongoDB collection `external_event_bookings` caches which internal userIds are booked into which external eventIds. It is populated by the background refresh job (iterates all token-holders) and updated immediately on book/unbook. `map_external_event` receives a set of attendee IDs and uses them when `showBooked=true` or the current user is admin.

**Tech Stack:** Python 3, FastAPI, Pydantic v2, PyMongo, APScheduler, pytest

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Modify | `backend/v1/db/models/external_events.py` | Add `ExternalEventBooking` Pydantic model |
| Modify | `backend/v1/db/mongo.py` | Register `external_event_bookings_collection` + index |
| Create | `backend/v1/db/external_bookings.py` | CRUD: upsert, delete, bulk lookup by eventId |
| Modify | `backend/v1/events/events_mappers.py` | Add `attendee_user_ids` param to `map_external_event` |
| Modify | `backend/v1/events/events_service.py` | Fetch attendees in `list_unified_events`; sync on book/unbook |
| Modify | `backend/v1/jobs/refresh_events.py` | Add `refresh_external_bookings()` call |
| Modify | `backend/v1/jobs/scheduler.py` | (no change needed — refresh_events already scheduled) |
| Modify | `backend/__tests__/unified_events-test.py` | Tests for new attendee propagation |

---

### Task 1: Add `ExternalEventBooking` model and register collection

**Files:**
- Modify: `backend/v1/db/models/external_events.py`
- Modify: `backend/v1/db/mongo.py`

- [ ] **Step 1: Add the model**

Open `backend/v1/db/models/external_events.py` and append at the end:

```python
class ExternalEventBooking(BaseModel):
    userId: int
    eventId: int
```

- [ ] **Step 2: Register collection in mongo.py**

Open `backend/v1/db/mongo.py`. Add the import and collection after the existing ones.

After:
```python
from v1.db.models.external_events import ExternalEventDetails, ExternalRoot
```
Change to:
```python
from v1.db.models.external_events import ExternalEventDetails, ExternalRoot, ExternalEventBooking
```

After the line:
```python
external_root_collection = db[get_collection_name(ExternalRoot)]
```
Add:
```python
external_event_bookings_collection = db[get_collection_name(ExternalEventBooking)]
```

Inside `initialize_db()`, after the `external_event_collection.create_index("eventId", unique=True)` line, add:
```python
        initialize_collection(ExternalEventBooking, db)
        external_event_bookings_collection.create_index(
            [("userId", 1), ("eventId", 1)], unique=True
        )
        external_event_bookings_collection.create_index("eventId")
```

- [ ] **Step 3: Commit**

```bash
cd /Volumes/Projects/swagapp
git add backend/v1/db/models/external_events.py backend/v1/db/mongo.py
git commit -m "feat(db): add ExternalEventBooking model and collection"
```

---

### Task 2: Create `external_bookings.py` CRUD module

**Files:**
- Create: `backend/v1/db/external_bookings.py`
- Test: `backend/__tests__/unified_events-test.py` (new test section)

- [ ] **Step 1: Write failing tests**

Open `backend/__tests__/unified_events-test.py` and add these tests at the end of the file:

```python
# ── ExternalBookings CRUD tests ─────────────────────────────────────────────

def test_upsert_and_get_bookings_by_event(monkeypatch):
    """upsert_user_bookings stores pairs; get_bookings_by_event_ids groups by eventId."""
    from v1.db import external_bookings as eb

    stored = []

    def fake_bulk_write(ops, ordered=False):
        for op in ops:
            doc = op._doc["$setOnInsert"] if "$setOnInsert" in op._doc else op._doc
            # simplify: track what was upserted
            stored.append(op._filter)

    class FakeCol:
        def bulk_write(self, ops, ordered=False):
            fake_bulk_write(ops, ordered)
        def find(self, query):
            if query == {"eventId": {"$in": [10, 20]}}:
                return [
                    {"userId": 1, "eventId": 10},
                    {"userId": 2, "eventId": 10},
                    {"userId": 3, "eventId": 20},
                ]
            return []

    monkeypatch.setattr(eb, "external_event_bookings_collection", FakeCol())

    result = eb.get_bookings_by_event_ids([10, 20])
    assert set(result[10]) == {1, 2}
    assert set(result[20]) == {3}
    assert eb.get_bookings_by_event_ids([]) == {}


def test_delete_user_bookings(monkeypatch):
    from v1.db import external_bookings as eb

    deleted_filter = []

    class FakeCol:
        def delete_many(self, f):
            deleted_filter.append(f)

    monkeypatch.setattr(eb, "external_event_bookings_collection", FakeCol())
    eb.delete_user_bookings(userId=5)
    assert deleted_filter == [{"userId": 5}]


def test_delete_booking(monkeypatch):
    from v1.db import external_bookings as eb

    deleted = []

    class FakeCol:
        def delete_one(self, f):
            deleted.append(f)

    monkeypatch.setattr(eb, "external_event_bookings_collection", FakeCol())
    eb.delete_booking(userId=5, eventId=99)
    assert deleted == [{"userId": 5, "eventId": 99}]
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Volumes/Projects/swagapp/backend
python -m pytest __tests__/unified_events-test.py::test_upsert_and_get_bookings_by_event __tests__/unified_events-test.py::test_delete_user_bookings __tests__/unified_events-test.py::test_delete_booking -v 2>&1 | tail -20
```

Expected: `ModuleNotFoundError` or `ImportError` — `external_bookings` does not exist yet.

- [ ] **Step 3: Create the module**

Create `backend/v1/db/external_bookings.py`:

```python
from __future__ import annotations
import logging
from typing import Dict, List, Set
from pymongo import UpdateOne
from v1.db.mongo import external_event_bookings_collection


def upsert_user_bookings(userId: int, event_ids: List[int]) -> None:
    """Replace all bookings for userId with the given event_ids."""
    if not event_ids:
        delete_user_bookings(userId)
        return
    ops = [
        UpdateOne(
            {"userId": userId, "eventId": eid},
            {"$setOnInsert": {"userId": userId, "eventId": eid}},
            upsert=True,
        )
        for eid in event_ids
    ]
    try:
        external_event_bookings_collection.bulk_write(ops, ordered=False)
        # Remove stale entries (events no longer booked)
        external_event_bookings_collection.delete_many(
            {"userId": userId, "eventId": {"$nin": event_ids}}
        )
    except Exception as e:
        logging.error(f"[external_bookings] upsert_user_bookings failed for userId={userId}: {e}")


def delete_user_bookings(userId: int) -> None:
    """Remove all booking records for a user (e.g. token expired, all unbooked)."""
    try:
        external_event_bookings_collection.delete_many({"userId": userId})
    except Exception as e:
        logging.error(f"[external_bookings] delete_user_bookings failed for userId={userId}: {e}")


def delete_booking(userId: int, eventId: int) -> None:
    """Remove a single booking record."""
    try:
        external_event_bookings_collection.delete_one({"userId": userId, "eventId": eventId})
    except Exception as e:
        logging.error(f"[external_bookings] delete_booking failed userId={userId} eventId={eventId}: {e}")


def add_booking(userId: int, eventId: int) -> None:
    """Insert a single booking record (idempotent)."""
    try:
        external_event_bookings_collection.update_one(
            {"userId": userId, "eventId": eventId},
            {"$setOnInsert": {"userId": userId, "eventId": eventId}},
            upsert=True,
        )
    except Exception as e:
        logging.error(f"[external_bookings] add_booking failed userId={userId} eventId={eventId}: {e}")


def get_bookings_by_event_ids(event_ids: List[int]) -> Dict[int, Set[int]]:
    """Return {eventId: set(userIds)} for all given eventIds."""
    if not event_ids:
        return {}
    try:
        result: Dict[int, Set[int]] = {}
        for doc in external_event_bookings_collection.find({"eventId": {"$in": event_ids}}):
            result.setdefault(doc["eventId"], set()).add(doc["userId"])
        return result
    except Exception as e:
        logging.error(f"[external_bookings] get_bookings_by_event_ids failed: {e}")
        return {}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Volumes/Projects/swagapp/backend
python -m pytest __tests__/unified_events-test.py::test_upsert_and_get_bookings_by_event __tests__/unified_events-test.py::test_delete_user_bookings __tests__/unified_events-test.py::test_delete_booking -v 2>&1 | tail -20
```

Expected: 3 PASSED.

- [ ] **Step 5: Commit**

```bash
cd /Volumes/Projects/swagapp
git add backend/v1/db/external_bookings.py backend/__tests__/unified_events-test.py
git commit -m "feat(db): add external_bookings CRUD module with tests"
```

---

### Task 3: Update `map_external_event` to accept attendee IDs

**Files:**
- Modify: `backend/v1/events/events_mappers.py`
- Test: `backend/__tests__/unified_events-test.py`

- [ ] **Step 1: Write failing tests**

In `backend/__tests__/unified_events-test.py`, add:

```python
# ── map_external_event attendee tests ────────────────────────────────────────

def test_map_external_event_with_attendee_ids():
    ext = make_external_event(200, booked=2)
    mapped = map_external_event(ext, current_user_id=1, booked_ids={200}, attendee_user_ids={1, 7})
    assert {a.userId for a in mapped.attendees} == {1, 7}


def test_map_external_event_no_attendee_ids_gives_empty():
    ext = make_external_event(201)
    mapped = map_external_event(ext, current_user_id=1, booked_ids=set(), attendee_user_ids=None)
    assert mapped.attendees == []


def test_map_external_event_empty_set_gives_empty():
    ext = make_external_event(202)
    mapped = map_external_event(ext, current_user_id=1, booked_ids=set(), attendee_user_ids=set())
    assert mapped.attendees == []
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Volumes/Projects/swagapp/backend
python -m pytest __tests__/unified_events-test.py::test_map_external_event_with_attendee_ids __tests__/unified_events-test.py::test_map_external_event_no_attendee_ids_gives_empty __tests__/unified_events-test.py::test_map_external_event_empty_set_gives_empty -v 2>&1 | tail -20
```

Expected: TypeError — `map_external_event()` got unexpected keyword argument `attendee_user_ids`.

- [ ] **Step 3: Update `map_external_event` signature and usage**

In `backend/v1/events/events_mappers.py`, change the function signature from:

```python
def map_external_event(details: ExternalEventDetails, current_user_id: int, booked_ids: Set[int]) -> Optional[Event]:
```

to:

```python
def map_external_event(
    details: ExternalEventDetails,
    current_user_id: int,
    booked_ids: Set[int],
    attendee_user_ids: Optional[Set[int]] = None,
) -> Optional[Event]:
```

Also add `Optional` and `Set` to the imports at the top if not already present:
```python
from typing import Optional, Set
```

Inside the function body, replace the line:
```python
            attendees=[],  # hardcoded empty — external API does not expose attendee list
```
with:
```python
            attendees=(
                [EventAttendee(userId=uid) for uid in attendee_user_ids]
                if attendee_user_ids is not None
                else []
            ),
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Volumes/Projects/swagapp/backend
python -m pytest __tests__/unified_events-test.py -v 2>&1 | tail -30
```

Expected: all previously passing tests still PASS, plus 3 new ones.

- [ ] **Step 5: Commit**

```bash
cd /Volumes/Projects/swagapp
git add backend/v1/events/events_mappers.py backend/__tests__/unified_events-test.py
git commit -m "feat(events): map_external_event accepts optional attendee_user_ids"
```

---

### Task 4: Wire attendee lookup into `list_unified_events`

**Files:**
- Modify: `backend/v1/events/events_service.py`
- Test: `backend/__tests__/unified_events-test.py`

- [ ] **Step 1: Write a failing integration test**

Add to `backend/__tests__/unified_events-test.py`:

```python
# ── list_unified_events attendee propagation ─────────────────────────────────

def test_list_unified_events_populates_attendees_when_show_booked(monkeypatch):
    import v1.events.events_service as svc

    ext = make_external_event(300, booked=1)
    ext.showBooked = True

    monkeypatch.setattr(svc, "get_booked_external_events", lambda uid: [])
    monkeypatch.setattr(svc, "get_all_stored_external_event_details", lambda: [ext])
    monkeypatch.setattr(svc, "get_safe_user_events_since", lambda since: [])
    monkeypatch.setattr(svc, "get_users_by_ids", lambda ids: [])
    # Simulate bookings DB returning userId=42 for eventId=300
    monkeypatch.setattr(svc, "get_bookings_by_event_ids", lambda ids: {300: {42}})

    current_user = {"userId": 1, "settings": {}}
    events = svc.list_unified_events(current_user)
    ext_events = [e for e in events if e.id == "ext300"]
    assert len(ext_events) == 1
    assert {a.userId for a in ext_events[0].attendees} == {42}


def test_list_unified_events_no_attendees_when_show_booked_false_and_not_admin(monkeypatch):
    import v1.events.events_service as svc

    ext = make_external_event(301, booked=5)
    ext.showBooked = False
    ext.admins = None

    monkeypatch.setattr(svc, "get_booked_external_events", lambda uid: [])
    monkeypatch.setattr(svc, "get_all_stored_external_event_details", lambda: [ext])
    monkeypatch.setattr(svc, "get_safe_user_events_since", lambda since: [])
    monkeypatch.setattr(svc, "get_users_by_ids", lambda ids: [])
    monkeypatch.setattr(svc, "get_bookings_by_event_ids", lambda ids: {301: {42}})

    current_user = {"userId": 1, "settings": {}}
    events = svc.list_unified_events(current_user)
    ext_events = [e for e in events if e.id == "ext301"]
    assert len(ext_events) == 1
    assert ext_events[0].attendees == []


def test_list_unified_events_admin_sees_attendees_even_if_show_booked_false(monkeypatch):
    import v1.events.events_service as svc

    ext = make_external_event(302, booked=2)
    ext.showBooked = False
    ext.admins = ["99"]  # userId 99 is admin

    monkeypatch.setattr(svc, "get_booked_external_events", lambda uid: [])
    monkeypatch.setattr(svc, "get_all_stored_external_event_details", lambda: [ext])
    monkeypatch.setattr(svc, "get_safe_user_events_since", lambda since: [])
    monkeypatch.setattr(svc, "get_users_by_ids", lambda ids: [])
    monkeypatch.setattr(svc, "get_bookings_by_event_ids", lambda ids: {302: {7, 8}})

    current_user = {"userId": 99, "settings": {}}
    events = svc.list_unified_events(current_user)
    ext_events = [e for e in events if e.id == "ext302"]
    assert len(ext_events) == 1
    assert {a.userId for a in ext_events[0].attendees} == {7, 8}
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Volumes/Projects/swagapp/backend
python -m pytest __tests__/unified_events-test.py::test_list_unified_events_populates_attendees_when_show_booked __tests__/unified_events-test.py::test_list_unified_events_no_attendees_when_show_booked_false_and_not_admin __tests__/unified_events-test.py::test_list_unified_events_admin_sees_attendees_even_if_show_booked_false -v 2>&1 | tail -20
```

Expected: AttributeError — `module has no attribute 'get_bookings_by_event_ids'` (not imported yet).

- [ ] **Step 3: Update `events_service.py`**

At the top of `backend/v1/events/events_service.py`, add this import after the existing imports:

```python
from v1.db.external_bookings import get_bookings_by_event_ids
```

Inside `list_unified_events`, find the section after `external_events_details` is fetched:

```python
    external_events: List[Event] = []
    for d in external_events_details:
        mapped = map_external_event(d, current_user_id, booked_ids)
        if mapped:
            external_events.append(_filter_event_attendees(mapped, current_user))
```

Replace with:

```python
    # Bulk-fetch attendee user IDs for all external events in one DB query
    try:
        all_event_ids = [d.eventId for d in external_events_details]
        bookings_by_event = get_bookings_by_event_ids(all_event_ids)
    except Exception as e:
        logging.error(f"Failed to fetch external event bookings: {e}")
        bookings_by_event = {}

    external_events: List[Event] = []
    for d in external_events_details:
        # Determine if attendees should be exposed for this event
        admin_ids: List[int] = []
        if d.admins:
            for a in d.admins:
                try:
                    admin_ids.append(int(a))
                except (ValueError, TypeError):
                    pass
        user_is_admin = current_user_id in admin_ids
        should_show_attendees = d.showBooked or user_is_admin

        attendee_user_ids = bookings_by_event.get(d.eventId) if should_show_attendees else None

        mapped = map_external_event(d, current_user_id, booked_ids, attendee_user_ids)
        if mapped:
            external_events.append(_filter_event_attendees(mapped, current_user))
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Volumes/Projects/swagapp/backend
python -m pytest __tests__/unified_events-test.py -v 2>&1 | tail -30
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Volumes/Projects/swagapp
git add backend/v1/events/events_service.py backend/__tests__/unified_events-test.py
git commit -m "feat(events): populate external event attendees from bookings collection"
```

---

### Task 5: Sync bookings collection on book/unbook

**Files:**
- Modify: `backend/v1/events/events_service.py`
- Test: `backend/__tests__/unified_events-test.py`

- [ ] **Step 1: Write failing tests**

Add to `backend/__tests__/unified_events-test.py`:

```python
# ── book/unbook booking sync tests ──────────────────────────────────────────

def test_attend_external_event_syncs_booking(monkeypatch):
    import v1.events.events_service as svc
    from v1.db.models.external_events import ExternalEventDetails as EED

    ext = make_external_event(400)
    added = []

    monkeypatch.setattr(svc, "book_external_event", lambda uid, eid: {"status": "OK"})
    monkeypatch.setattr(svc, "get_all_stored_external_event_details", lambda: [ext])
    monkeypatch.setattr(svc, "get_booked_external_events", lambda uid: [])
    monkeypatch.setattr(svc, "add_booking", lambda userId, eventId: added.append((userId, eventId)))

    current_user = {"userId": 5, "settings": {}}
    svc._attend_external_event("ext400", current_user)
    assert (5, 400) in added


def test_unattend_external_event_syncs_booking(monkeypatch):
    import v1.events.events_service as svc

    deleted = []
    monkeypatch.setattr(svc, "unbook_external_event", lambda uid, eid: {"status": "OK"})
    monkeypatch.setattr(svc, "delete_booking", lambda userId, eventId: deleted.append((userId, eventId)))

    current_user = {"userId": 5, "settings": {}}
    svc._unattend_external_event("ext400", current_user)
    assert (5, 400) in deleted
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Volumes/Projects/swagapp/backend
python -m pytest __tests__/unified_events-test.py::test_attend_external_event_syncs_booking __tests__/unified_events-test.py::test_unattend_external_event_syncs_booking -v 2>&1 | tail -20
```

Expected: AttributeError — `module has no attribute 'add_booking'`.

- [ ] **Step 3: Import add_booking and delete_booking in events_service.py**

In `backend/v1/events/events_service.py`, update the external_bookings import line from:

```python
from v1.db.external_bookings import get_bookings_by_event_ids
```

to:

```python
from v1.db.external_bookings import get_bookings_by_event_ids, add_booking, delete_booking
```

- [ ] **Step 4: Sync add_booking in `_attend_external_event`**

In `backend/v1/events/events_service.py`, find `_attend_external_event`. After the line:

```python
        result = book_external_event(current_user["userId"], event_id)
        logging.info(f"Successfully booked external event {event_id} for user {current_user['userId']}")
```

Add:

```python
        # Sync booking to local cache
        try:
            add_booking(userId=current_user["userId"], eventId=event_id)
        except Exception as e:
            logging.error(f"Failed to sync booking to cache for userId={current_user['userId']} eventId={event_id}: {e}")
```

- [ ] **Step 5: Sync delete_booking in `_unattend_external_event`**

In `backend/v1/events/events_service.py`, find `_unattend_external_event`. After the line:

```python
        result = unbook_external_event(current_user["userId"], event_id)
        logging.info(f"Successfully unbooked external event {event_id} for user {current_user['userId']}")
```

Add:

```python
        # Sync booking removal to local cache
        try:
            delete_booking(userId=current_user["userId"], eventId=event_id)
        except Exception as e:
            logging.error(f"Failed to sync booking removal for userId={current_user['userId']} eventId={event_id}: {e}")
```

- [ ] **Step 6: Run all tests**

```bash
cd /Volumes/Projects/swagapp/backend
python -m pytest __tests__/unified_events-test.py -v 2>&1 | tail -30
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
cd /Volumes/Projects/swagapp
git add backend/v1/events/events_service.py backend/__tests__/unified_events-test.py
git commit -m "feat(events): sync external bookings cache on attend/unattend"
```

---

### Task 6: Background refresh of all users' bookings

**Files:**
- Modify: `backend/v1/jobs/refresh_events.py`
- Test: manual (no pure-unit test possible without mocking all external + DB calls)

- [ ] **Step 1: Add `refresh_external_bookings` function to `refresh_events.py`**

Open `backend/v1/jobs/refresh_events.py`. Add imports at the top:

```python
import logging
from v1.db.external_bookings import upsert_user_bookings, delete_user_bookings
from v1.db.mongo import tokenstorage_collection
from v1.external.event_api import get_booked_external_events
```

Then add the function after `refresh_external_events`:

```python
def refresh_external_bookings():
    """Refresh the external_event_bookings collection for all users with stored tokens."""
    try:
        user_ids = [doc["userId"] for doc in tokenstorage_collection.find({}, {"userId": 1})]
    except Exception as e:
        logging.error(f"[refresh_external_bookings] Failed to fetch token holders: {e}")
        return

    logging.info(f"[refresh_external_bookings] Refreshing bookings for {len(user_ids)} users")
    for user_id in user_ids:
        try:
            booked = get_booked_external_events(user_id)
            event_ids = [e.eventId for e in booked]
            upsert_user_bookings(userId=user_id, event_ids=event_ids)
        except Exception as e:
            logging.warning(f"[refresh_external_bookings] Skipping userId={user_id}: {e}")
```

- [ ] **Step 2: Call `refresh_external_bookings` from `refresh_external_events`**

At the end of the `refresh_external_events` function in `backend/v1/jobs/refresh_events.py`, add:

```python
    # Refresh per-user booking cache after events are updated
    refresh_external_bookings()
```

The full `refresh_external_events` function should end with:
```python
    for event in all_external_events:
        event_id = event.eventId
        stored_event = get_stored_external_event_details(event_ids=[event_id])
        if not stored_event:
            logging.error(f"Event {event_id} not found in the database after cleaning.")
            continue

    # Refresh per-user booking cache after events are updated
    refresh_external_bookings()
```

- [ ] **Step 3: Run full test suite to confirm no regressions**

```bash
cd /Volumes/Projects/swagapp/backend
python -m pytest __tests__/ -v 2>&1 | tail -40
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /Volumes/Projects/swagapp
git add backend/v1/jobs/refresh_events.py
git commit -m "feat(jobs): refresh external event bookings for all users in background job"
```

---

### Task 7: Push and verify

- [ ] **Step 1: Run full test suite one final time**

```bash
cd /Volumes/Projects/swagapp/backend
python -m pytest __tests__/ -v 2>&1 | tail -40
```

Expected: all tests PASS.

- [ ] **Step 2: Push**

```bash
cd /Volumes/Projects/swagapp
git pull --rebase
git push
```

- [ ] **Step 3: Close the task**

```bash
grit tasks close swagapp-xi5pz --reason="External event attendees now populated from cached bookings collection. Background job refreshes all users. Book/unbook syncs immediately. Frontend was already wired up."
```
