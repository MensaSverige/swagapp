"""
Migration: rename ShowLocation enum values to unified PrivacySetting values,
and convert show_email / show_phone from booleans to PrivacySetting strings.

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
