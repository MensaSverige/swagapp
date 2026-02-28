"""
Token storage using PostgreSQL via SQLAlchemy.
"""
from datetime import datetime
from v1.db.models.tokenstorage import TokenStorage
from v1.db.database import SessionLocal
from v1.db.tables import TokenStorageTable
from v1.utilities import convert_to_tz_aware, get_current_time


def save_external_token(user_id: int, external_token: str,
                        expires_at: datetime):
    token = TokenStorage.model_validate({
        "userId": user_id,
        "externalAccessToken": external_token,
        "createdAt": convert_to_tz_aware(get_current_time()),
        "expiresAt": convert_to_tz_aware(expires_at),
    })

    token_data = token.model_dump()

    with SessionLocal() as session:
        existing = session.query(TokenStorageTable).filter_by(userId=user_id).first()
        if existing:
            existing.externalAccessToken = token_data["externalAccessToken"]
            existing.createdAt = token_data["createdAt"]
            existing.expiresAt = token_data["expiresAt"]
        else:
            session.add(TokenStorageTable(**token_data))
        session.commit()


def get_external_token(user_id: int):
    with SessionLocal() as session:
        row = session.query(TokenStorageTable).filter_by(userId=user_id).first()
        if not row:
            return None

        expires_at_tz_aware = convert_to_tz_aware(row.expiresAt)

        if expires_at_tz_aware > get_current_time():
            return row.externalAccessToken
