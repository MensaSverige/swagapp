from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from v1.token_handler import verify_access_token
from v1.db.users import get_user

bearer_scheme = HTTPBearer()


async def validate_request(
        bearer: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if bearer:
        try:
            valid, payload = verify_access_token(bearer.credentials)
            if not valid:
                raise HTTPException(status_code=401, detail="Unauthorized")
            user = get_user(payload.get("sub"))
            return user
        except:
            raise HTTPException(status_code=401, detail="Unauthorized")
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")


async def require_member(
        current_user: dict = Depends(validate_request)):
    if not current_user['isMember']:
        raise HTTPException(status_code=403, detail="Not a member")

    return current_user