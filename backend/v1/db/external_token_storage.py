"""Token storage using PostgreSQL via SQLAlchemy."""
from datetime import datetime, timezone
from v1.db.models.tokenstorage import TokenStorage
from v1.db.database import get_session
from v1.db.tables import TokenStorageTable


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_utc(dt: datetime) -> datetime:
    """Return dt as a UTC-aware datetime, treating naive datetimes as UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def save_external_token(user_id: int, external_token: str, expires_at: datetime) -> None:
    now = _utc_now()
    expires_utc = _ensure_utc(expires_at)

    with get_session() as session:
        existing = session.query(TokenStorageTable).filter_by(userId=user_id).first()
        if existing:
            existing.externalAccessToken = external_token
            existing.createdAt = now
            existing.expiresAt = expires_utc
        else:
            session.add(TokenStorageTable(
                userId=user_id,
                externalAccessToken=external_token,
                createdAt=now,
                expiresAt=expires_utc,
            ))
        session.commit()


def get_external_token(user_id: int) -> str | None:
    with get_session() as session:
        row = session.query(TokenStorageTable).filter_by(userId=user_id).first()
        if not row:
            return None
        expires_utc = _ensure_utc(row.expiresAt) if isinstance(row.expiresAt, datetime) else None
        if expires_utc and expires_utc > _utc_now():
            return row.externalAccessToken
        return None
