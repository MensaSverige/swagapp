from fastapi import APIRouter, Depends
from db.models.user import User
from request_filter import validate_request
from db.users import get_user, get_users

users_v1 = APIRouter(prefix="/v1")

@users_v1.get("/users/{user_id}")
async def get_user_by_id(user_id: int):
    user = get_user(user_id)
    return user
    

@users_v1.get("/users_showing_location")
def users_showing_location(current_user: User = Depends(validate_request)):
    return get_users(show_location=True)

@users_v1.get("/users/me/", response_model=User)
async def get_current_user(current_user: User = Depends(validate_request)):
    return current_user