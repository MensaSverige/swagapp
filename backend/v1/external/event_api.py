from datetime import datetime
import json
import logging
from typing import List
import requests
from fastapi import HTTPException
from v1.utilities import convert_string_to_datetime
from v1.db.external_events import store_external_event_details, store_external_root
from v1.db.models.external_events import ExternalRoot, ExternalEvent, ExternalEventDetails
from v1.db.external_token_storage import get_external_token
from v1.env_constants import EVENT_API_TOKEN, URL_EXTERNAL_ROOT


def get_booked_external_events(userId: int) -> list[ExternalEvent]:

    root = get_external_root()
    url = root.restUrl

    parameters = {
        'operation': 'booked',
        'token': get_external_token(userId),
    }
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url,
                             json=parameters,
                             headers=headers,
                             verify=False)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    response_data = response.json()
    if 'events' not in response_data:
        logging.info(f"Failed to get booked events: {response_data}")
        return []
    
    events_list = response_data['events']
    return [ExternalEvent.model_validate(event) for event in events_list]


def get_external_root() -> ExternalRoot:
    headers = {'Content-Type': 'application/json'}
    response = requests.get(URL_EXTERNAL_ROOT, headers=headers, verify=False)
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="External root API is down! Panic!")
    
    root = ExternalRoot.model_validate(response.json())
    store_external_root(root)
    return root

def get_external_event_details(url: str, date: str):
    parameters = {
        'operation': 'events',
        'date': date,
        'token': EVENT_API_TOKEN,
    }
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url,
                             json=parameters,
                             headers=headers,
                             verify=False)

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    eventdate = convert_string_to_datetime(date)
    try:
        response_json = response.json()
        events = response_json['events']
        validated_events: List[ExternalEventDetails] = []
        for event in events:
            try:
                event_json = json.dumps(event)
                validated = ExternalEventDetails.model_validate_json(
                    event_json)

                # Convert startTime string to time object
                start_time = datetime.strptime(validated.startTime,
                                               '%H:%M').time()

                # Combine eventDate and startTime
                validated.eventDate = datetime.combine(eventdate, start_time)

                validated_events.append(validated)

            except Exception as e:
                logging.error(f"Failed to validate event: {e}")
    except Exception as e:
        logging.error(f"Failed to validate external event details: {e}")
        return

    try:
        store_external_event_details(validated_events)
        logging.info("Successfully stored external event details.")
    except Exception as e:
        logging.error(f"Failed to store external event details: {e}")
