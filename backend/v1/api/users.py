from fastapi import APIRouter
from db.users import get_users

users_v1 = APIRouter(prefix="/v1")

@users_v1.get("/users_showing_location")
def users_showing_location():
    return get_users(show_location=True)

