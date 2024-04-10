from datetime import datetime
import os
import logging
from fastapi import APIRouter, Depends, HTTPException
import requests
from pydantic import BaseModel
import requests
import logging
from request_filter import validate_request
from db.external_token_storage import save_external_token
from token_handler import create_access_token, create_refresh_token, get_token_expiry, verify_refresh_token
from db.models.user import User
from db.users import create_user, get_user
from utilities import calc_hash, get_current_time, get_current_time_formatted

try:
    LOGINM_SEED = os.getenv('LOGINM_SEED')
    LOGINB_SEED = os.getenv('LOGINB_SEED')
    EVENT_API_TOKEN = os.getenv('EVENT_API_TOKEN')

    if LOGINM_SEED is None or LOGINB_SEED is None or EVENT_API_TOKEN is None:
        raise ValueError("One or more environment variables are not set")

except ValueError as e:
    print(f"Error: {e}")
url = 'https://medlem.mensa.se/mensa_verify/restlogin.php'
url2 = 'https://events.mensa.se/swag2024/info-rest/?sec_action=app-api'

auth_v1 = APIRouter(prefix="/v1")

class AuthRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    accessToken: str
    refreshToken: str
    accessTokenExpiry: datetime
    user: User

@auth_v1.post("/authm")
def authm(request: AuthRequest) -> AuthResponse:
    client = 'swagapp'
    user = request.username
    password = request.password
    timestamp = get_current_time_formatted()

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
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid credentials")


    response_json = response.json()
    logging.info(f"response_json: {response_json}")
    try:
        memberId = response_json["memberId"]
        user = get_user(memberId)
        if not user:
            user = create_user(response_json)
    except KeyError:
        print("memberId not found in response")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    save_external_token(user["userId"], response_json["token"], response_json["validThrough"])
    accesstoken = create_access_token(user["userId"])

    authresponse = AuthResponse(
        accessToken=accesstoken,
        refreshToken=create_refresh_token(user["userId"]),
        accessTokenExpiry=get_token_expiry(accesstoken),
        user=user
    )
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

@auth_v1.post("/refresh_token")
def refresh_token(refresh_token: str) -> AuthResponse:
    try:
        valid, payload = verify_refresh_token(refresh_token)
        if not valid:
            raise HTTPException(status_code=401, detail="Unauthorized")
        user = get_user(payload.get("sub"))
        accesstoken = create_access_token(user["userId"])

        authresponse = AuthResponse(
            accessToken=accesstoken,
            refreshToken=create_refresh_token(user["userId"]),
            accessTokenExpiry=get_token_expiry(accesstoken),
            user=user
        )
        return authresponse
    except:
        raise HTTPException(status_code=401, detail="Unauthorized")
