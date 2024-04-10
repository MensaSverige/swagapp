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

def convert_to_tz_aware(naive_dt):
    aware_dt = naive_dt.replace(tzinfo=pytz.utc).astimezone(get_current_time_zone())
    return aware_dt

def get_current_time_formatted():
    return datetime.now(get_current_time_zone()).strftime('%Y-%m-%d %H:%M:%S')

def get_time_from_timestamp(timestamp):
    return datetime.fromtimestamp(timestamp, get_current_time_zone())