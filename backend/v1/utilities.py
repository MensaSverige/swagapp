import hashlib
from datetime import datetime
import pytz

swedish_tz = pytz.timezone('Europe/Stockholm')

def calc_hash(strings):
    combined_string = "\n".join(strings)
    return hashlib.sha256(combined_string.encode('utf-8')).hexdigest()

def get_current_time():
    return datetime.now(swedish_tz)   

def get_current_time_formatted():
    return datetime.now(swedish_tz).strftime('%Y-%m-%d %H:%M:%S')

def get_time_from_timestamp(timestamp):
    return datetime.fromtimestamp(timestamp, swedish_tz)