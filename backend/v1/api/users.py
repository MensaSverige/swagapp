import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from token_handler import verify_access_token
from db.models.user import User
from db.users import get_user, get_users

bearer_scheme = HTTPBearer()
users_v1 = APIRouter(prefix="/v1")

async def validate_request(request: Request, bearer: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if bearer:
        try:
            logging.info(f"bearer credentials: {bearer.credentials}")
            valid, payload = verify_access_token(bearer.credentials)
            logging.info(f"result: {payload}")
            if not valid:
                raise HTTPException(status_code=401, detail="Unauthorized")
            userId = get_user(payload.get("sub"))
            logging.info(f"userId: {userId}")
            return userId
        except:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return bearer.credentials
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")



@users_v1.get("/users/me/", response_model=User)
async def get_current_user(current_user: User = Depends(validate_request)):
    return current_user
    

@users_v1.get("/users_showing_location")
def users_showing_location(user: str = Depends(validate_request)):
    return get_users(show_location=True)