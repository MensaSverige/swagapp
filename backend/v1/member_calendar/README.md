# Member Calendar Integration

Syncs the event calendar from the Mensa member site (medlem.mensa.se) into this
app's unified events table.

The member site runs IPS Community Suite. We read its `calendar_calendar_events`
MySQL table directly over an SSH tunnel rather than subscribing to the site's
iCalendar feed, because the table carries location, booking and category data
the feed does not expose. An earlier draft of this feature did use the feed;
nothing of that approach remains except the `IPS_*` connection settings, which
name the software the member site happens to run.

## Architecture

1. **Model** (`calendar_model.py`)
   - `MemberCalendarEvent`: one event as the member site describes it
   - The single model between the source database and the unified `Event`

2. **Source** (`ips_source.py`)
   - `fetch_member_calendar_events()`: opens the SSH tunnel, queries MySQL,
     returns `MemberCalendarEvent`s
   - `row_to_event()`: one database row to one model, HTML stripped from the body
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

```bash
IPS_SSH_HOST=medlem.mensa.se
IPS_SSH_PORT=54599
IPS_SSH_USER=***
IPS_SSH_PASSWORD=***
# IPS_SSH_KEY_PATH=  # Optional: key auth instead of password
IPS_DB_HOST=localhost
IPS_DB_NAME=ips
IPS_DB_USER=ips
IPS_DB_PASS=***

# Job configuration (optional)
SYNC_MEMBER_CALENDAR_ENABLED=true
SYNC_MEMBER_CALENDAR_PERIOD=1800  # seconds (30 minutes)
```

The sync logs a warning and does nothing if `IPS_SSH_HOST` or `IPS_DB_NAME`
is unset, so an unconfigured environment starts cleanly.

## Event ID Format

- External events: `ext{eventId}`
- User events: `usr{id}`
- Member calendar events: `cal{eventId}`

## Dependencies

- `pymysql`: MySQL driver
- `sshtunnel`: SSH tunnel for remote DB access
