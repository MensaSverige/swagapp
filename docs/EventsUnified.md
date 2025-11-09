# Unified Events API

The unified events endpoints merge external (official) events from ag.mensa.se with user-created events stored in MongoDB.

## Endpoints

- `GET /v1/events` — list future events. Optional query parameters:
  - `attending=true|false` — filter by whether current user is attending/booked.
  - `bookable=true|false` — filter by whether the event is still bookable/joinable.
  - `official=true|false` — filter by source (external vs user).
- `GET /v1/events/attending` — shorthand for `/v1/events?attending=true`.
- `GET /v1/events/official` — shorthand for `/v1/events?official=true`.
- `GET /v1/events/unofficial` — shorthand for `/v1/events?official=false`.

All endpoints require authentication (`require_member`).

## Unified Event Model

```
Event {
  id: string              // ext:<eventId> or usr:<mongoId>
  parentEvent?: string
  admin: int[]            // owner/user admins for user events (external admins in extras.adminsRaw)
  hosts: Host[]           // user events hosts
  name: string
  tags: int[]
  locationDescription?: string
  address?: string
  locationMarker?: string
  latitude?: float
  longitude?: float
  start: datetime
  end?: datetime
  cancelled?: datetime
  imageUrl?: string
  description?: string
  bookingStart?: datetime
  bookingEnd?: datetime
  showAttendees: enum(none, all, toAttending)
  attendees: Attendee[]   // only for user events
  queue: Attendee[]       // currently unused
  maxAttendees?: int
  price: float
  official: boolean       // true = external
  attending: boolean      // current user attending/booked
  bookable: boolean       // can the current user still book / join
  extras: object {        // source specific
    speaker?: string
    categories?: Category[]
    eventUrl?: string
    adminsRaw?: string[]
    mapUrl?: string
    showBooked?: bool
    bookedCount?: int
    ownerName?: string
    hostNames?: string[]
    attendeeNames?: string[]
    reportsCount?: int
  }
}
```

## Mapping Rules

### External Events
- `id = ext:<eventId>`
- `start = eventDate` (already combined during ingestion)
- `end` computed from `endTime` if present.
- `attending` determined via booked external events set.
- `bookable` true if inside booking window, capacity not full (stock > booked), not yet attending, and start is in the future.
- `price` uses `price` unless `isFree` then 0.
- `maxAttendees` set to `stock` if `isLimited`.
- Attendees are not exposed; `showAttendees = none`.

### User Events
- `id = usr:<mongoId>`
- `attending` based on presence of current user in attendees.
- `bookable` true if future, capacity not full, and user not already attending.
- `bookingEnd` defaults to `start` for convenience; `bookingStart` omitted.
- `showAttendees = all`.

## Filtering Semantics
- Query param omitted => no filtering on that dimension.
- Provided => exact match.
- Returned events are always future (past events removed in service layer).

## Notes / Future Extensions
- Add tags classification when available.
- Support queue semantics if user events add waiting list.
- Persist unified view caching layer if performance requires.

