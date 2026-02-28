"""
Token storage using PostgreSQL via SQLAlchemy.
"""
from datetime import datetime
from v1.db.models.tokenstorage import TokenStorage
from v1.db.database import get_session
from v1.db.tables import TokenStorageTable
from v1.utilities import convert_to_tz_aware, get_current_time


def save_external_token(user_id: int, external_token: str,
                        expires_at: datetime):
    now = get_current_time()
    token = TokenStorage.model_validate({
        "userId": user_id,
        "externalAccessToken": external_token,
        "createdAt": now,
        "expiresAt": expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=now.tzinfo),
    })

    token_data = token.model_dump()

    with get_session() as session:
        existing = session.query(TokenStorageTable).filter_by(userId=user_id).first()
        if existing:
            existing.externalAccessToken = token_data["externalAccessToken"]
            existing.createdAt = token_data["createdAt"]
            existing.expiresAt = token_data["expiresAt"]
        else:
            session.add(TokenStorageTable(**token_data))
        session.commit()


def get_external_token(user_id: int):
    with get_session() as session:
        row = session.query(TokenStorageTable).filter_by(userId=user_id).first()
        if not row:
            return None

        # Compare as naive datetimes in the same timezone
        now = get_current_time().replace(tzinfo=None)
        expires_at = row.expiresAt if isinstance(row.expiresAt, datetime) else row.expiresAt
        if isinstance(expires_at, datetime) and expires_at.tzinfo is not None:
            expires_at = expires_at.replace(tzinfo=None)

        if expires_at > now:
            return row.externalAccessToken
