import hashlib
from datetime import datetime
import pytz


def calc_hash(strings):
    combined_string = "\n".join(strings)
    return hashlib.sha256(combined_string.encode('utf-8')).hexdigest()

def get_current_time():
    swedish_tz = pytz.timezone('Europe/Stockholm')
    return datetime.now(swedish_tz)   

def get_current_time_formatted():
    swedish_tz = pytz.timezone('Europe/Stockholm')
    return datetime.now(swedish_tz).strftime('%Y-%m-%d %H:%M:%S')
