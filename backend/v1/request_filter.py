from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from v1.token_handler import verify_access_token
from v1.db.users import get_user
import logging

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer()


async def validate_request(
        bearer: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if bearer:
        try:
            valid, payload = verify_access_token(bearer.credentials)
            if not valid:
                logger.error("Invalid token: ", bearer.credentials)
                raise HTTPException(status_code=401, detail="Unauthorized")
            user = get_user(int(payload.get("sub")))
            return user
        except:
            logging.error("Error validating token: ", bearer.credentials)
            raise HTTPException(status_code=401, detail="Unauthorized")
    else:
        logging.error("No token provided")
        raise HTTPException(status_code=403, detail="Unauthorized")


async def require_member(
        current_user: dict = Depends(validate_request)):
    if not current_user or not current_user['isMember']:
        logging.error("User is not a member: %s", current_user)
        raise HTTPException(status_code=403, detail="Not a member")

    return current_user