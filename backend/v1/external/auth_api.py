import requests
import logging
from fastapi import HTTPException
from v1.env_constants import LOGINM_SEED, LOGINB_SEED, URL_MEMBER_API, URL_EVENTS_API
from v1.utilities import calc_hash, get_current_time_formatted


def loginm(username, password):
    client = 'swagapp'
    user = username
    password = password
    timestamp = get_current_time_formatted()

    loginm_hash = [user, password, timestamp, LOGINM_SEED]
    hash = calc_hash(loginm_hash)
    loginm_par = {
        'client': client,
        'user': user,
        'password': password,
        'timestamp': get_current_time_formatted(),
        'hash': hash
    }

    loggable_data = loginm_par.copy()
    loggable_data.pop('password', None)
    logging.info(f"loginm_par: {loggable_data}")
    headers = {'Content-Type': 'application/json'}
    response = requests.post(URL_MEMBER_API,
                             json=loginm_par,
                             headers=headers,
                             verify=False)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    return response.json()

def loginb(user, password):
    client = 'swagapp'
    timestamp = get_current_time_formatted()
    loginb_hash = [user, password, timestamp, LOGINB_SEED]
    hash = calc_hash(loginb_hash)
    loginb_par = {
        'operation': 'loginb',
        'client': client,
        'user': user,
        'password': password,
        'timestamp': timestamp,
        'hash': hash
    }

    loggable_data = loginb_par.copy()
    loggable_data.pop('password', None)
    logging.info(f"loginb_par: {loggable_data}")
    headers = {'Content-Type': 'application/json'}
    response = requests.post(URL_EVENTS_API,
                             json=loginb_par,
                             headers=headers,
                             verify=False)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    return response.json()
