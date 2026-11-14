# Member Calendar Integration

Syncs the event calendar from the Mensa member site (medlem.mensa.se) into this
app's unified events table.

The member site runs IPS Community Suite. We read its `calendar_events` MySQL
table directly over an SSH tunnel rather than subscribing to the site's
iCalendar feed, because the table carries location, booking and category data
the feed does not expose. An earlier draft of this feature did use the feed;
nothing of that approach remains.

The site also serves IPS's own REST API, and it is not an option: calendar
event ids come back null (IPS 4.1 returns `$this->tid`, and the table has no
such column), every event embeds its author's email address, registration IP
and contact fields, and the page size is fixed at 25, so a full read is 198
requests. Measured against the live site on 2026-11-14.

## Architecture

1. **Model** (`calendar_model.py`)
   - `MemberCalendarEvent`: one event as the member site describes it
   - The single model between the source database and the unified `Event`

2. **Source** (`ips_source.py`)
   - `fetch_member_calendar_events()`: opens the SSH tunnel, queries MySQL,
     returns `MemberCalendarEvent`s
   - `_private_key()`: parses the SSH key from its TEXT, never a file path --
     a pod reads credentials from its environment and has nowhere to point a
     path at. A PEM flattened to one line with literal `\n` is repaired,
     because secret stores and env files do that routinely and silently
   - `row_to_event()`: one database row to one model, HTML stripped from the body
   - The query joins `core_members` for the organiser's display name and their
     Mensa membership number (`mensa_id`), and takes nothing else from that
     table -- it also holds email addresses and registration IPs
   - IPS specifics are confined to this file

3. **Database layer** (`calendar_db.py`)
   - `store_member_calendar_events()`: upserts into `events` on
     `(source, source_id)`, so a re-sync updates in place
   - `get_member_calendar_events_since()`: events from a date onward
   - `delete_member_calendar_event()` / `clear_member_calendar_events()`

4. **Mapper** (`../events/events_mappers.py`)
   - `map_member_calendar_event()`: `MemberCalendarEvent` to unified `Event`

5. **Background job** (`../jobs/refresh_member_calendar.py`)
   - `refresh_member_calendar()`: runs every 30 minutes by default

## Storage

Events land in the unified `events` table tagged `source = calendar`. That
table is the PostgreSQL counterpart of the old MongoDB `unifiedevents`
collection: one row per event from any source, keyed by `(source, source_id)`.

The member calendar is currently its only writer. User events and external
events still live in `user_events` and `external_event_details` and are mapped
into the unified `Event` shape on read; moving them into this table is a
separate piece of work.

## Configuration

The first four live in swagapp's secret vault under exactly these names.

```bash
MEDLEM_HOST=medlem.mensa.se
MEDLEM_PORT=54599
MEDLEM_USERNAME=***
MEDLEM_SSH_KEY="-----BEGIN OPENSSH PRIVATE KEY-----\n..."   # the key itself
# MEDLEM_SSH_PASSWORD=***   # only if there is no key
MEDLEM_DB_HOST=localhost
MEDLEM_DB_NAME=ips
MEDLEM_DB_USER=***
MEDLEM_DB_PASS=***

# Job configuration (optional)
SYNC_MEMBER_CALENDAR_ENABLED=true
SYNC_MEMBER_CALENDAR_PERIOD=1800  # seconds (30 minutes)
```

The sync logs a warning and does nothing if `MEDLEM_HOST` or `MEDLEM_DB_NAME`
is unset, or if neither a usable key nor a password is present, so an
unconfigured environment starts cleanly and a broken key is refused before
anything tries to connect.

**The database account these credentials belong to can write.** An `UPDATE`
matching no rows was accepted on 2026-11-14, so whatever holds these settings
holds read-write access to the whole member community database, not just the
calendar. A read-only account scoped to the calendar tables is the thing to
ask the member site's administrators for.

## Event ID Format

- External events: `ext{eventId}`
- User events: `usr{id}`
- Member calendar events: `cal{eventId}`

## Approximate coordinates

The member site gives real coordinates for 80 of its ~4900 events. The rest are
placed from a postal code or a city, and those lookups are cached between runs
— see `docs/Geocoding.md`, including the radius each guess carries.

## Dependencies

- `pymysql`: MySQL driver
- `sshtunnel`: SSH tunnel for remote DB access
- `paramiko`: parses the SSH key from the environment (arrives with sshtunnel)
