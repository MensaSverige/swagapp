"""
Migration: rename ShowLocation enum values to unified PrivacySetting values,
convert show_email / show_phone from booleans to PrivacySetting strings,
and repair any null/missing privacy fields.

PrivacySetting values valid for show_location (all client versions):
  NO_ONE, MEMBERS_ONLY, MEMBERS_MUTUAL, EVERYONE_MUTUAL, EVERYONE

Backwards-compat note: the old ShowLocation enum already included EVERYONE and
EVERYONE_MUTUAL, so clients pre-dating the PrivacySetting rename already
understand those values. The old 3-option member UI (NO_ONE / MEMBERS_MUTUAL /
MEMBERS_ONLY) will display a blank dropdown if it receives EVERYONE_MUTUAL or
EVERYONE, but will not corrupt the stored value on save unless the user actively
changes the field.

Runs automatically on every server startup via initialize_app() in server.py.
All update_many calls are idempotent — safe to run repeatedly.
"""

import logging
from v1.db.mongo import user_collection

_LOCATION_RENAMES = {
    "ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION": "MEMBERS_MUTUAL",
    "ALL_MEMBERS": "MEMBERS_ONLY",
    "EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION": "EVERYONE_MUTUAL",
}


def run():
    for old_value, new_value in _LOCATION_RENAMES.items():
        result = user_collection.update_many(
            {"settings.show_location": old_value},
            {"$set": {"settings.show_location": new_value}},
        )
        if result.modified_count:
            logging.info(f"Migration: show_location {old_value} → {new_value}: {result.modified_count} documents")

    # Repair null / missing privacy fields so Pydantic defaults are persisted in DB.
    for field, default in (
        ("show_location", "NO_ONE"),
        ("show_email",    "NO_ONE"),
        ("show_phone",    "NO_ONE"),
        ("show_profile",  "MEMBERS_ONLY"),
    ):
        r = user_collection.update_many(
            {f"settings.{field}": {"$in": [None, ""]}},
            {"$set": {f"settings.{field}": default}},
        )
        if r.modified_count:
            logging.info(f"Migration: {field} null/empty → {default}: {r.modified_count} documents")

    for field in ("show_email", "show_phone"):
        r = user_collection.update_many({f"settings.{field}": True},  {"$set": {f"settings.{field}": "MEMBERS_ONLY"}})
        if r.modified_count:
            logging.info(f"Migration: {field} True → MEMBERS_ONLY: {r.modified_count} documents")
        r = user_collection.update_many({f"settings.{field}": False}, {"$set": {f"settings.{field}": "NO_ONE"}})
        if r.modified_count:
            logging.info(f"Migration: {field} False → NO_ONE: {r.modified_count} documents")


if __name__ == "__main__":
    run()
    print("Migration complete.")
