import os
import logging
from fastapi import APIRouter, HTTPException, Request
import requests
from pydantic import BaseModel
import requests
import logging
from db.users import create_user, get_user
from utilities import calc_hash, get_current_time

LOGINM_SEED = os.getenv('LOGINM_SEED')
LOGINB_SEED = os.getenv('LOGINB_SEED')
EVENT_API_TOKEN = os.getenv('EVENT_API_TOKEN')
url = 'https://medlem.mensa.se/mensa_verify/restlogin.php'
url2 = 'https://events.mensa.se/swag2024/info-rest/?sec_action=app-api'

auth_v1 = APIRouter(prefix="/v1")

class AuthRequest(BaseModel):
    username: str
    password: str
    test: bool = False

class AuthResponse(BaseModel):
    token: str
    validThrough: str
    isMember: bool
    userId: str

@auth_v1.post("/authm")
async def authm(request: AuthRequest):
    logging.info(f"request: {request}")
    logging.info(f"hash: {LOGINM_SEED}")
    client = 'swagapp'
    user = request.username
    password = request.password
    timestamp = get_current_time()

    loginm_hash = [user, password, timestamp, LOGINM_SEED]
    hash = calc_hash(loginm_hash)

    loginm_par = {
        'client': client,
        'user': user,
        'password': password,
        'timestamp': timestamp,
        'hash': hash
    }

    logging.info(f"loginm_par: {loginm_par}")
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, json=loginm_par, headers=headers, verify=False)
    logging.info(f"Text: {response.text}")
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    response_json = response.json()

    user = get_user(response_json["memberId"])
    if not user:
        create_user(response_json)

    mapped_response = {
        "token": response_json["token"],
        "validThrough": response_json["validThrough"],
        "isMember": response_json["type"] == "M",
        "userId": response_json["memberId"],
    }
    authresponse = AuthResponse.model_validate(mapped_response)
    return authresponse


@auth_v1.post("/authb")
async def authb(request: AuthRequest):
    logging.info(f"request: {request}")
    client = 'swagapp'
    operation = 'loginb'
    user = request.username
    password = request.password
    timestamp = get_current_time()

    loginb_hash = [user, password, timestamp, LOGINB_SEED]
    hash = calc_hash(loginb_hash)

    loginb_par = {
        'client': client,
        'operation': operation,
        'user': user,
        'password': password,
        'timestamp': timestamp,
        'hash': hash
    }

    logging.info(f"loginb_par: {loginb_par}")
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, json=loginb_par, headers=headers, verify=False)
    logging.info(f"Text: {response.text}")


    return response.json()


