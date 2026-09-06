import hashlib
from datetime import datetime
import pytz

def calc_hash(strings):
    combined_string = "\n".join(strings)
    return hashlib.sha256(combined_string.encode('utf-8')).hexdigest()

def get_current_time():
    return datetime.now(get_current_time_zone())   

def get_current_time_zone():
    return pytz.timezone('Europe/Stockholm')

def convert_string_to_datetime(datestring: str):
    return datetime.strptime(datestring, '%Y-%m-%d')

def ensure_aware(dt):
    """Return ``dt`` as a timezone-aware datetime in the application timezone.

    Datetimes that reach the application without an offset are Swedish local
    wall-clock readings — the Mensa API reports local times, and clients post
    local times. MongoDB could not store an offset, so the codebase used to
    strip tzinfo everywhere and rely on both ends agreeing. PostgreSQL stores
    the offset natively (every column is ``timestamptz``), so naive values are
    localized here instead and stay aware from that point on.

    Already-aware datetimes are returned unchanged, whatever their offset.
    """
    if dt is None or dt.tzinfo is not None:
        return dt
    # localize(), not replace(tzinfo=...): a pytz zone carries a Local Mean
    # Time offset (+1:12 for Stockholm) that replace() would apply verbatim.
    return get_current_time_zone().localize(dt)


# Convert naive datetime to timezone aware datetime
def convert_to_tz_aware(naive_dt):
    aware_dt = naive_dt.replace(tzinfo=pytz.utc).astimezone(get_current_time_zone())
    return aware_dt

def get_current_time_formatted():
    return datetime.now(get_current_time_zone()).strftime('%Y-%m-%d %H:%M:%S')

def get_time_from_timestamp(timestamp):
    return datetime.fromtimestamp(timestamp, get_current_time_zone())