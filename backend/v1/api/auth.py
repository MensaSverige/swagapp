from datetime import datetime
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from v1.db.review_users import check_review_user_creds
from v1.utilities import convert_string_to_datetime
from v1.external.auth_api import loginm, loginb
from v1.db.external_token_storage import save_external_token
from v1.token_handler import create_access_token, create_refresh_token, get_token_expiry, verify_refresh_token
from v1.db.models.user import User
from v1.db.users import create_user, get_user

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
    response = check_review_user_creds(request.username, request.password)

    if response is not None:
        # Important, so we can look at the logs to see when the app is being reviewed ;)
        logging.info(f"Review user logged in! {request.username}")
    else:
        response = loginm(request.username, request.password)

    logging.info(f"response_json: {response}")
    try:
        memberId = int(response["memberId"])
        user = get_user(memberId)
        if not user:
            user = create_user(response)
    except KeyError as e:
        print("memberId not found in response")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    save_external_token(user["userId"], response["token"],
                        convert_string_to_datetime(response["validThrough"]))
    accesstoken = create_access_token(user["userId"])

    authresponse = AuthResponse(
        accessToken=accesstoken,
        refreshToken=create_refresh_token(user["userId"]),
        accessTokenExpiry=get_token_expiry(accesstoken),
        user=user)
    return authresponse


@auth_v1.post("/authb")
def authb(request: AuthRequest) -> AuthResponse:
    response = loginb(request.username, request.password)

    logging.info(f"Non member login, response_json: {response}")
    try:
        memberId = int(response["memberId"])
        user = get_user(memberId)
        if not user:
            user = create_user(response)
    except KeyError as e:
        print("memberId not found in response")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    save_external_token(user["userId"], response["token"],
                        convert_string_to_datetime(response["validThrough"]))
    accesstoken = create_access_token(user["userId"])

    authresponse = AuthResponse(
        accessToken=accesstoken,
        refreshToken=create_refresh_token(user["userId"]),
        accessTokenExpiry=get_token_expiry(accesstoken),
        user=user)
    return authresponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str

@auth_v1.post("/refresh_token")
def refresh_token(refresh_token: RefreshTokenRequest) -> AuthResponse:
    try:
        valid, payload = verify_refresh_token(refresh_token.refresh_token)
        if not valid:
            raise HTTPException(status_code=401, detail="Unauthorized")
        user = get_user(payload.get("sub"))
        accesstoken = create_access_token(user["userId"])

        authresponse = AuthResponse(
            accessToken=accesstoken,
            refreshToken=create_refresh_token(user["userId"]),
            accessTokenExpiry=get_token_expiry(accesstoken),
            user=user)
        return authresponse
    except:
        raise HTTPException(status_code=401, detail="Unauthorized")
