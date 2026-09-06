"""Persisted map from public feedback user_hash to actual user (moderation tool)."""
import datetime
import logging

from v1.db.database import get_session
from v1.db.tables import FeedbackUserIndexTable

logger = logging.getLogger(__name__)


def register_user(user: dict, user_hash: str) -> None:
    """Upsert (user_hash → user_id) and bump last_seen on every feedback action."""
    now = datetime.datetime.now(datetime.timezone.utc)
    try:
        with get_session() as session:
            row = session.query(FeedbackUserIndexTable).filter_by(user_hash=user_hash).first()
            if row:
                row.user_id = user.get("userId")
                row.member_number = user.get("memberNumber") or user.get("member_number")
                row.is_member = user.get("isMember", False)
                row.last_seen = now
            else:
                row = FeedbackUserIndexTable(
                    user_hash=user_hash,
                    user_id=user.get("userId"),
                    member_number=user.get("memberNumber") or user.get("member_number"),
                    is_member=user.get("isMember", False),
                    first_seen=now,
                    last_seen=now,
                )
                session.add(row)
            session.commit()
    except Exception:
        logger.exception("Failed to upsert feedback_user_index entry")


def lookup(user_hash: str) -> dict | None:
    with get_session() as session:
        row = session.query(FeedbackUserIndexTable).filter_by(user_hash=user_hash).first()
        if not row:
            return None
        return {
            "user_hash": row.user_hash,
            "user_id": row.user_id,
            "member_number": row.member_number,
            "is_member": row.is_member,
            "first_seen": row.first_seen,
            "last_seen": row.last_seen,
        }
