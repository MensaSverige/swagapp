from datetime import datetime
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from utilities import convert_string_to_datetime
from external.auth_api import loginm
from db.external_token_storage import save_external_token
from token_handler import create_access_token, create_refresh_token, get_token_expiry, verify_refresh_token
from db.models.user import User
from db.users import create_user, get_user

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
    response = loginm(request.username, request.password)

    logging.info(f"response_json: {response}")
    try:
        memberId = int(response["memberId"])
        user = get_user(memberId)
        if not user:
            user = create_user(response)
    except KeyError:
        print("memberId not found in response")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    save_external_token(user["userId"], response["token"], convert_string_to_datetime(response["validThrough"]))
    accesstoken = create_access_token(user["userId"])

    authresponse = AuthResponse(
        accessToken=accesstoken,
        refreshToken=create_refresh_token(user["userId"]),
        accessTokenExpiry=get_token_expiry(accesstoken),
        user=user
    )
    return authresponse

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
