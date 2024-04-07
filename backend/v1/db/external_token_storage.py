import datetime
from db.models.tokenstorage import TokenStorage
from db.mongo import tokenstorage_collection
from utilities import get_current_time


def save_external_token(user_id: int, external_token: str, expires_at: datetime):
    token = TokenStorage.model_validate({
        "userId": user_id,
        "externalAccessToken": external_token,
        "createdAt": get_current_time(),
        "expiresAt": expires_at
    })

    # Upsert option to ensure no duplicate entries for the same user
    tokenstorage_collection.update_one(
        {"userId": user_id},
        {"$set": token},
        upsert=True
    )

def get_external_token(user_id: int):
    token_info = tokenstorage_collection.find_one({"userId": user_id})
    if token_info and token_info['expiresAt'] > get_current_time():
        return token_info['externalAccessToken']
    else:
        # Token is expired or not found, handle accordingly
        return None