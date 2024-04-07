from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from token_handler import verify_access_token
from db.models.user import User
from db.users import get_user, get_users

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
users_v1 = APIRouter(prefix="/v1")

@users_v1.get("/users_showing_location")
def users_showing_location():
    return get_users(show_location=True)

@users_v1.get("/users/me/", response_model=User)
async def read_users_me(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code = 401,
        detail = "Could not validate credentials",
        headers = {"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_access_token(token)
        if payload is None:
            raise credentials_exception
        user = get_user(payload.get("sub"))
        return user
    except:
        raise credentials_exception