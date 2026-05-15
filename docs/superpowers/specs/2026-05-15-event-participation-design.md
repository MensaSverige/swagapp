# Event Participation: Attendees on External Events

**Task**: swagapp-xi5pz (P1)

## Decisions

1. **New MongoDB collection** (`external_event_bookings`) stores `{userId, eventId}` pairs — we don't have this data today; we derive it by iterating all users with stored tokens.
2. **Backend-only change** — the frontend (`UnifiedEventCard` → `useEventUsers` → attendees `UserList`) is already wired up and works correctly once the API returns non-empty `attendees`.
3. **Two triggers for populating attendees on external events**: (a) `showBooked=true` on the raw external event, OR (b) current user is admin of the event (`current_user_id in admin_ids`). The `showAttendees` field on the unified event is already set from `showBooked`; admin override is added in `list_unified_events`.
4. **Background refresh updates bookings** for all users with stored tokens. On-demand book/unbook also syncs immediately.
5. **Privacy filter still applies** — `_filter_event_attendees` in `events_service.py` filters based on users' `show_attendance` privacy settings. External attendees get the same filter.

## Goal

Populate the `attendees` field on unified external events when:
- `showAttendees == 'all'` (mapped from `showBooked=true`), OR
- Current user is admin/host of the event

Currently `attendees=[]` is hardcoded for all external events in `events_mappers.py:137`.

## Architecture

### New collection: `external_event_bookings`

```python
class ExternalEventBooking(BaseModel):
    userId: int
    eventId: int  # raw external eventId
```

Indexed on `eventId` (fast lookup when building events list) and `userId` (fast per-user refresh).

### Data flow

```
[Background job: refresh_external_bookings()]
    ↓ iterate all users in tokenstorage_collection
    ↓ call get_booked_external_events(userId) for each
    ↓ upsert {userId, eventId} pairs into external_event_bookings
    ↓ delete stale pairs for users where eventId no longer in their booked list

[On book / unbook]
    _attend_external_event  → insert {userId, eventId}
    _unattend_external_event → delete {userId, eventId}

[list_unified_events]
    map_external_event(details, user_id, booked_ids, attendee_user_ids)
        attendee_user_ids = lookup external_event_bookings by eventId
        only passed when showBooked OR user is admin
```

### Files changed

| File | Change |
|---|---|
| `backend/v1/db/models/external_events.py` | Add `ExternalEventBooking` model |
| `backend/v1/db/mongo.py` | Register `external_event_bookings_collection` |
| `backend/v1/db/external_bookings.py` | New: CRUD for `external_event_bookings` |
| `backend/v1/jobs/refresh_events.py` | Add `refresh_external_bookings()` call after event refresh |
| `backend/v1/events/events_mappers.py` | Add `attendee_user_ids: set[int]` param to `map_external_event` |
| `backend/v1/events/events_service.py` | Fetch attendee IDs and pass to `map_external_event`; update book/unbook to sync |
| `backend/__tests__/unified_events-test.py` | Add tests for attendees propagation |

### `map_external_event` signature change

```python
def map_external_event(
    details: ExternalEventDetails,
    current_user_id: int,
    booked_ids: Set[int],
    attendee_user_ids: Set[int] | None = None,  # NEW
) -> Optional[Event]:
```

When `attendee_user_ids` is provided (non-None), set `attendees=[EventAttendee(userId=uid) for uid in attendee_user_ids]`. Otherwise keep `[]`.

### `list_unified_events` logic

```python
# After fetching all external event details:
bookings_by_event = get_bookings_by_event_ids([d.eventId for d in external_events_details])

for d in external_events_details:
    admin_ids = [int(a) for a in (d.admins or []) if a.isdigit()]
    user_is_admin = current_user_id in admin_ids
    should_show_attendees = d.showBooked or user_is_admin
    
    attendee_ids = bookings_by_event.get(d.eventId) if should_show_attendees else None
    mapped = map_external_event(d, current_user_id, booked_ids, attendee_ids)
```

## Error handling

- `refresh_external_bookings` catches per-user failures and continues (same pattern as refresh_events job)
- If `get_bookings_by_event_ids` fails in `list_unified_events`, log and fall back to empty attendees (not a hard error)
- Book/unbook sync failures are logged but don't fail the booking itself

## Tests

1. `test_map_external_event_with_attendees` — verify attendee IDs appear in mapped event
2. `test_map_external_event_no_attendees_when_show_booked_false` — verify empty attendees when not admin and showBooked=False
3. `test_list_unified_events_populates_attendees_for_show_booked` — integration test with monkeypatched DB

## Considered alternatives

**A. Only show current user in their own attendees list**
- Pro: No new collection, immediate with data we already have
- Con: Useless for seeing who else is attending; doesn't scale
- Rejected: The UI expectation is to show all attendees

**B. Call external API on every request for each event**
- Pro: Always fresh
- Con: N×M API calls (events × users) per unified events request; not feasible
- Rejected: Performance kill

**C. Chosen: Cached bookings collection**
- Fresh enough via background job
- Immediate on book/unbook
- One extra DB lookup per events request (single aggregation query)

## Risks and mitigations

- **Token expiry**: users whose token has expired are silently skipped in the refresh job; graceful degradation, their booking still removed on unbook
- **Staleness**: refresh runs every 15 min (matches existing event refresh cadence); acceptable for attendance display
- **External API completeness**: `get_booked_external_events` is not paginated in this external system (Mensa Sverige has O(10s) events per user); not a practical concern
- **Privacy filter**: `_filter_event_attendees` calls `get_users_by_ids` and checks each user's `show_attendance` setting in our own user DB. External event attendees are our internal users (stored by `userId`), so the filter applies correctly
- **Admin + showBooked=false**: intentional — an event admin (e.g. a host who set showBooked=false) legitimately needs to see who's coming to their event; this is standard event management behavior
