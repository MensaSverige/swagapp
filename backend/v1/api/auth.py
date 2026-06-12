from datetime import datetime
import logging
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
import logging
from v1.db.review_users import check_review_user_creds
from v1.utilities import convert_string_to_datetime
from v1.external.auth_api import loginm, loginb
from v1.db.external_token_storage import save_external_token
from v1.token_handler import create_access_token, create_refresh_token, get_token_expiry, verify_refresh_token
from v1.db.models.user import User
from v1.db.users import create_user, get_user, update_user_from_authresponse

REFRESH_TOKEN_COOKIE = "swag_refresh_token"
REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24  # 24 h — matches token_handler.py

# COOKIE_SECURE=false in local dev (HTTP). Always true in production.
_COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true").lower() != "false"


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=_COOKIE_SECURE,
        samesite="none" if not _COOKIE_SECURE else "lax",
        max_age=REFRESH_TOKEN_MAX_AGE,
        path="/",
    )

auth_v1 = APIRouter(prefix="/v1")


class AuthRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    accessToken: str
    refreshToken: str
    accessTokenExpiry: datetime
    user: User


def _do_login(login_response: dict, http_response: Response) -> AuthResponse:
    try:
        memberId = int(login_response["memberId"])
        user = get_user(memberId)
        if not user:
            user = create_user(login_response)
        else:
            update_user_from_authresponse(memberId, login_response)
            user = get_user(memberId)
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    save_external_token(user["userId"], login_response["token"],
                        convert_string_to_datetime(login_response["validThrough"]))
    accesstoken = create_access_token(user["userId"])
    refresh = create_refresh_token(user["userId"])
    _set_refresh_cookie(http_response, refresh)

    return AuthResponse(
        accessToken=accesstoken,
        refreshToken=refresh,
        accessTokenExpiry=get_token_expiry(accesstoken),
        user=user)


@auth_v1.post("/authm")
def authm(request: AuthRequest, http_response: Response) -> AuthResponse:
    response = check_review_user_creds(request.username, request.password)
    if response is not None:
        logging.info("Review user logged in: %s", request.username)
    else:
        response = loginm(request.username, request.password)
    return _do_login(response, http_response)


@auth_v1.post("/authb")
def authb(request: AuthRequest, http_response: Response) -> AuthResponse:
    response = loginb(request.username, request.password)
    return _do_login(response, http_response)


class RefreshTokenRequest(BaseModel):
    # Optional — native clients send this in the body; web clients rely on
    # the httpOnly cookie set at login instead. Both paths are supported.
    refresh_token: Optional[str] = None


@auth_v1.post("/refresh_token")
def refresh_token(req: RefreshTokenRequest, http_request: Request, http_response: Response) -> AuthResponse:
    try:
        token = req.refresh_token or http_request.cookies.get(REFRESH_TOKEN_COOKIE)
        if not token:
            raise HTTPException(status_code=401, detail="Unauthorized")
        valid, payload = verify_refresh_token(token)
        if not valid:
            raise HTTPException(status_code=401, detail="Unauthorized")
        user = get_user(int(payload.get("sub")))
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        accesstoken = create_access_token(user["userId"])
        refresh = create_refresh_token(user["userId"])
        _set_refresh_cookie(http_response, refresh)
        authresponse = AuthResponse(
            accessToken=accesstoken,
            refreshToken=refresh,
            accessTokenExpiry=get_token_expiry(accesstoken),
            user=user)
        return authresponse
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")
