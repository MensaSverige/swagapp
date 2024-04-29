import logging
from datetime import datetime, timedelta
from typing import List
from v1.token_handler import create_token
from v1.env_constants import APPLE_REVIEW_USER, GOOGLE_REVIEW_USER, REVIEW_PASSWORD
from v1.db.models.user import ContactInfo, ShowLocation, User, UserSettings

apple_review_user_id = 1
google_review_user_id = 2

review_users: List[User] = [
    User(userId=apple_review_user_id,
         isMember=True,
         settings=UserSettings(show_location=ShowLocation.NO_ONE,
                               show_email=False,
                               show_phone=False),
         contact_info=ContactInfo(email="apple@apple.com")),
    User(userId=google_review_user_id,
         isMember=True,
         settings=UserSettings(show_location=ShowLocation.NO_ONE,
                               show_email=False,
                               show_phone=False),
         contact_info=ContactInfo(email="google@google.com")),
]


def check_review_user_creds(username: str, password: str) -> dict:
    logging.info(
        f"Checking if user creds: {username}, matches review user creds: {APPLE_REVIEW_USER}, {REVIEW_PASSWORD} or {GOOGLE_REVIEW_USER}, {REVIEW_PASSWORD}"
    )
    date = datetime.now()
    delta = timedelta(hours=12)
    date += delta
    if username == APPLE_REVIEW_USER and password == REVIEW_PASSWORD:
        token = create_token(
            apple_review_user_id, delta,
            "review")  # Fake token, meant to fail when used with Mensa API
        return {
            "memberId": apple_review_user_id,
            "token": token,
            "validThrough": date.strftime("%Y-%m-%d")
        }
    elif username == GOOGLE_REVIEW_USER and password == REVIEW_PASSWORD:
        token = create_token(
            google_review_user_id, delta,
            "review")  # Fake token, meant to fail when used with Mensa API
        return {
            "memberId": google_review_user_id,
            "token": token,
            "validThrough": date.strftime("%Y-%m-%d")
        }

    return None
