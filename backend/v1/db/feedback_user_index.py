"""Persisted map from the public feedback `user_hash` to the actual user.

The hash is intentionally one-way (HMAC) so it can sit publicly on GitHub
without leaking PII. But admins legitimately need to look up *who* posted
a given issue or comment — to contact someone, follow up on a bug
report, or moderate abuse. This collection holds that mapping so the
admin can paste a hash from a GitHub issue and recover the user_id /
member_number.

Stored fields are deliberately minimal: no message bodies, just identity
and timestamps. Treat as a moderation tool, not analytics.
"""
import datetime
import logging

from pymongo import ASCENDING

from v1.db.mongo import db

logger = logging.getLogger(__name__)

feedback_user_index_collection = db["feedback_user_index"]


def initialize_indexes() -> None:
    feedback_user_index_collection.create_index(
        [("user_hash", ASCENDING)], unique=True
    )
    feedback_user_index_collection.create_index([("user_id", ASCENDING)])


def register_user(user: dict, user_hash: str) -> None:
    """Upsert (user_hash → user_id) and bump last_seen on every feedback action."""
    now = datetime.datetime.utcnow()
    update = {
        "$setOnInsert": {
            "user_hash": user_hash,
            "first_seen": now,
        },
        "$set": {
            "user_id": user.get("userId"),
            "member_number": user.get("memberNumber") or user.get("member_number"),
            "is_member": user.get("isMember", False),
            "last_seen": now,
        },
    }
    try:
        feedback_user_index_collection.update_one(
            {"user_hash": user_hash}, update, upsert=True
        )
    except Exception:
        logger.exception("Failed to upsert feedback_user_index entry")


def lookup(user_hash: str) -> dict | None:
    return feedback_user_index_collection.find_one(
        {"user_hash": user_hash}, {"_id": 0}
    )
