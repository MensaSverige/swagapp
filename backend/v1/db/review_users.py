from typing import List
from env_constants import APPLE_REVIEW_USER, GOOGLE_REVIEW_USER, REVIEW_PASSWORD
from db.models.user import ContactInfo, ShowLocation, User, UserSettings

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
    if username == APPLE_REVIEW_USER and password == REVIEW_PASSWORD:
        return {"memberId": apple_review_user_id}
    elif username == GOOGLE_REVIEW_USER and password == REVIEW_PASSWORD:
        return {"memberId": google_review_user_id}

    return None
