import requests
import logging
from fastapi import HTTPException
from db.external_token_storage import get_external_token
from external.env_constants import LOGINM_SEED, URL_EVENTS_API
from utilities import calc_hash, get_current_time_formatted
from pydantic import BaseModel
from datetime import date, time

class ExternalEvent(BaseModel):
    eventId: int
    date: date
    time: time


{'eventId': 207, 'date': '2024-02-03', 'time': '13:09'},

def get_external_events(userId: int) -> list[ExternalEvent]:
    parameters = {
        'operation': 'booked',
        'token': get_external_token(userId),
    }
    headers = {'Content-Type': 'application/json'}
    response = requests.post(URL_EVENTS_API, json=parameters, headers=headers, verify=False)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    events = response.json()["events"]
    logging.info(f"events: {events}")
    return events