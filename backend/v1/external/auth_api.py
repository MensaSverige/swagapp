import requests
import logging
from fastapi import HTTPException
from v1.env_constants import LOGINM_SEED, URL_MEMBER_API
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

    logging.info(f"loginm_par: {loginm_par}")
    headers = {'Content-Type': 'application/json'}
    response = requests.post(URL_MEMBER_API,
                             json=loginm_par,
                             headers=headers,
                             verify=False)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    return response.json()
