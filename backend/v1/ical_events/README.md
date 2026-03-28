# Calendar Events Integration (IPS MySQL)

This module fetches calendar events directly from the IPS Community Suite MySQL database via SSH tunnel, providing richer data than the old iCal subscription approach (including location data).

## Architecture

### Components

1. **Models** (`ical_model.py`)
   - `ICalEvent`: Intermediate Pydantic model for parsed calendar events
   - Contains fields like uid, summary, description, location, start, end, etc.

2. **IPS Service** (`ips_calendar_service.py`)
   - `fetch_ips_calendar_events()`: Connects via SSH tunnel and queries the IPS MySQL database
   - `map_ips_to_ical()`: Maps IPS database rows to `ICalEvent` model
   - Strips HTML from event content

3. **Database Layer** (`ical_db.py`)
   - `store_ical_events()`: Stores/updates events in the unified MongoDB collection
   - `get_all_unified_ical_events()`: Retrieves all stored calendar events
   - `get_unified_ical_events_since()`: Retrieves events from a specific date

4. **Mappers** (`events_mappers.py`)
   - `map_ical_event()`: Converts `ICalEvent` to unified `Event` model

5. **Background Jobs** (`refresh_ical_events.py`)
   - `refresh_ical_events()`: Scheduled job to sync calendar events
   - Runs every 30 minutes by default

## Configuration

### Environment Variables

```bash
IPS_SSH_HOST=medlem.mensa.se
IPS_SSH_PORT=54599
IPS_SSH_USER=pontus
IPS_SSH_PASSWORD=***
# IPS_SSH_KEY_PATH=  # Optional: use key auth instead of password
IPS_DB_HOST=localhost
IPS_DB_NAME=ips
IPS_DB_USER=ips
IPS_DB_PASS=***

# Job configuration (optional)
SYNC_ICAL_EVENTS_ENABLED=true
SYNC_ICAL_EVENTS_PERIOD=1800  # seconds (30 minutes)
```

## Event ID Format

- External events: `ext{eventId}`
- User events: `usr{mongoId}`
- IPS calendar events: `ical{hash}` (first 8 chars of MD5 of UID)

## Dependencies

- `pymysql`: MySQL driver
- `sshtunnel`: SSH tunnel for remote DB access

Or check the scheduled job logs when the server starts.
