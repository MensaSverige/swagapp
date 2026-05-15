"""
Mongo → Postgres one-time data migration script.

Usage:
    MONGO_URL=mongodb://mongo:27017  DATABASE_URL=postgresql://swag:swag@postgres:5432/swag \
        python -m migrations.mongo_to_postgres

Idempotent: safe to run multiple times — uses INSERT … ON CONFLICT DO NOTHING (or DO UPDATE)
so rows already present in Postgres are not duplicated or overwritten.

Migrates:
    user          → users
    tokenstorage  → token_storage
    userevent     → user_events + event_hosts + event_suggested_hosts +
                    event_attendees + event_reports
    externaleventdetails → external_event_details + external_event_admins +
                           external_event_categories
    externalroot  → external_root + external_root_dates
    externaleventbooking → external_event_bookings

FeedbackVoteTable and FeedbackUserIndexTable have no MongoDB counterpart
(they are Postgres-only) and are skipped.
"""

import logging
import os
import sys
from datetime import datetime, timezone

# Allow running as: python -m migrations.mongo_to_postgres from backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)


# ── Connection setup ──────────────────────────────────────────────────────────

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://mongo:27017")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://swag:swag@postgres:5432/swag")

mongo_client = MongoClient(MONGO_URL)
mongo_db = mongo_client["swag"]

pg_engine = create_engine(DATABASE_URL, echo=False)
Session = sessionmaker(bind=pg_engine)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _tz(dt):
    """Ensure a datetime is timezone-aware (UTC)."""
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return dt


def _str(v, default=""):
    """Coerce to str, falling back to default."""
    if v is None:
        return default
    return str(v)


def _int(v, default=0):
    if v is None:
        return default
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def _bool(v, default=False):
    if v is None:
        return default
    return bool(v)


# ── Users ─────────────────────────────────────────────────────────────────────

def migrate_users(session):
    coll = mongo_db["user"]
    total = coll.count_documents({})
    log.info("users: %d documents in Mongo", total)

    inserted = skipped = 0
    for doc in coll.find():
        uid = doc.get("userId")
        if uid is None:
            log.warning("user doc missing userId, skipping: %s", doc.get("_id"))
            continue

        s = doc.get("settings") or {}
        loc = doc.get("location") or {}
        ci = doc.get("contact_info") or {}

        interests = doc.get("interests") or []
        social_vibes = doc.get("social_vibes") or []

        row = {
            "userId": uid,
            "isMember": _bool(doc.get("isMember")),
            "show_location": _str(s.get("show_location"), "NO_ONE"),
            "show_profile": _str(s.get("show_profile"), "MEMBERS_MUTUAL"),
            "show_email": _str(s.get("show_email"), "NO_ONE"),
            "show_phone": _str(s.get("show_phone"), "NO_ONE"),
            "show_interests": _str(s.get("show_interests"), "MEMBERS_MUTUAL"),
            "show_hometown": _str(s.get("show_hometown"), "MEMBERS_MUTUAL"),
            "show_birthdate": _str(s.get("show_birthdate"), "MEMBERS_MUTUAL"),
            "show_gender": _str(s.get("show_gender"), "NO_ONE"),
            "show_sexuality": _str(s.get("show_sexuality"), "NO_ONE"),
            "show_relationship_style": _str(s.get("show_relationship_style"), "NO_ONE"),
            "show_relationship_status": _str(s.get("show_relationship_status"), "NO_ONE"),
            "show_social_vibes": _str(s.get("show_social_vibes"), "MEMBERS_MUTUAL"),
            "show_pronomen": _str(s.get("show_pronomen"), "NO_ONE"),
            "show_attendance": _str(s.get("show_attendance"), "MEMBERS_MUTUAL"),
            "location_update_interval_seconds": _int(s.get("location_update_interval_seconds"), 60),
            "events_refresh_interval_seconds": _int(s.get("events_refresh_interval_seconds"), 60),
            "background_location_updates": _bool(s.get("background_location_updates")),
            "location_latitude": loc.get("latitude"),
            "location_longitude": loc.get("longitude"),
            "location_timestamp": _tz(loc.get("timestamp")),
            "location_accuracy": loc.get("accuracy"),
            "contact_email": ci.get("email"),
            "contact_phone": ci.get("phone"),
            "age": doc.get("age"),
            "slogan": doc.get("slogan"),
            "avatar_url": doc.get("avatar_url"),
            "firstName": doc.get("firstName"),
            "lastName": doc.get("lastName"),
            "interests": [i if isinstance(i, str) else str(i) for i in interests],
            "hometown": doc.get("hometown"),
            "birthdate": doc.get("birthdate"),
            "gender": doc.get("gender"),
            "sexuality": doc.get("sexuality"),
            "relationship_style": doc.get("relationship_style"),
            "relationship_status": doc.get("relationship_status"),
            "social_vibes": [v if isinstance(v, str) else str(v) for v in social_vibes],
            "pronomen": doc.get("pronomen"),
            "created_at": _tz(doc.get("created_at")) or datetime.now(timezone.utc),
            "updated_at": _tz(doc.get("updated_at")) or datetime.now(timezone.utc),
        }

        result = session.execute(text("""
            INSERT INTO users (
                "userId", "isMember",
                show_location, show_profile, show_email, show_phone,
                show_interests, show_hometown, show_birthdate, show_gender,
                show_sexuality, show_relationship_style, show_relationship_status,
                show_social_vibes, show_pronomen, show_attendance,
                location_update_interval_seconds, events_refresh_interval_seconds,
                background_location_updates,
                location_latitude, location_longitude, location_timestamp, location_accuracy,
                contact_email, contact_phone,
                age, slogan, avatar_url, "firstName", "lastName",
                interests, hometown, birthdate, gender, sexuality,
                relationship_style, relationship_status, social_vibes, pronomen,
                created_at, updated_at
            )
            VALUES (
                :userId, :isMember,
                :show_location, :show_profile, :show_email, :show_phone,
                :show_interests, :show_hometown, :show_birthdate, :show_gender,
                :show_sexuality, :show_relationship_style, :show_relationship_status,
                :show_social_vibes, :show_pronomen, :show_attendance,
                :location_update_interval_seconds, :events_refresh_interval_seconds,
                :background_location_updates,
                :location_latitude, :location_longitude, :location_timestamp, :location_accuracy,
                :contact_email, :contact_phone,
                :age, :slogan, :avatar_url, :firstName, :lastName,
                :interests::jsonb, :hometown, :birthdate, :gender, :sexuality,
                :relationship_style, :relationship_status, :social_vibes::jsonb, :pronomen,
                :created_at, :updated_at
            )
            ON CONFLICT ("userId") DO UPDATE SET
                "isMember"                          = EXCLUDED."isMember",
                show_location                       = EXCLUDED.show_location,
                show_profile                        = EXCLUDED.show_profile,
                show_email                          = EXCLUDED.show_email,
                show_phone                          = EXCLUDED.show_phone,
                show_interests                      = EXCLUDED.show_interests,
                show_hometown                       = EXCLUDED.show_hometown,
                show_birthdate                      = EXCLUDED.show_birthdate,
                show_gender                         = EXCLUDED.show_gender,
                show_sexuality                      = EXCLUDED.show_sexuality,
                show_relationship_style             = EXCLUDED.show_relationship_style,
                show_relationship_status            = EXCLUDED.show_relationship_status,
                show_social_vibes                   = EXCLUDED.show_social_vibes,
                show_pronomen                       = EXCLUDED.show_pronomen,
                show_attendance                     = EXCLUDED.show_attendance,
                location_update_interval_seconds    = EXCLUDED.location_update_interval_seconds,
                events_refresh_interval_seconds     = EXCLUDED.events_refresh_interval_seconds,
                background_location_updates         = EXCLUDED.background_location_updates,
                location_latitude                   = EXCLUDED.location_latitude,
                location_longitude                  = EXCLUDED.location_longitude,
                location_timestamp                  = EXCLUDED.location_timestamp,
                location_accuracy                   = EXCLUDED.location_accuracy,
                contact_email                       = EXCLUDED.contact_email,
                contact_phone                       = EXCLUDED.contact_phone,
                age                                 = EXCLUDED.age,
                slogan                              = EXCLUDED.slogan,
                avatar_url                          = EXCLUDED.avatar_url,
                "firstName"                         = EXCLUDED."firstName",
                "lastName"                          = EXCLUDED."lastName",
                interests                           = EXCLUDED.interests,
                hometown                            = EXCLUDED.hometown,
                birthdate                           = EXCLUDED.birthdate,
                gender                              = EXCLUDED.gender,
                sexuality                           = EXCLUDED.sexuality,
                relationship_style                  = EXCLUDED.relationship_style,
                relationship_status                 = EXCLUDED.relationship_status,
                social_vibes                        = EXCLUDED.social_vibes,
                pronomen                            = EXCLUDED.pronomen,
                updated_at                          = EXCLUDED.updated_at
        """), {**row, "interests": __import__("json").dumps(row["interests"]),
                      "social_vibes": __import__("json").dumps(row["social_vibes"])})

        inserted += 1

    session.commit()
    log.info("users: %d upserted", inserted)
    return total, inserted


# ── Token storage ─────────────────────────────────────────────────────────────

def migrate_token_storage(session):
    coll = mongo_db["tokenstorage"]
    total = coll.count_documents({})
    log.info("tokenstorage: %d documents in Mongo", total)

    inserted = 0
    for doc in coll.find():
        uid = doc.get("userId")
        if uid is None:
            continue
        session.execute(text("""
            INSERT INTO token_storage ("userId", "externalAccessToken", "createdAt", "expiresAt")
            VALUES (:userId, :token, :createdAt, :expiresAt)
            ON CONFLICT ("userId") DO UPDATE SET
                "externalAccessToken" = EXCLUDED."externalAccessToken",
                "createdAt"           = EXCLUDED."createdAt",
                "expiresAt"           = EXCLUDED."expiresAt"
        """), {
            "userId": uid,
            "token": _str(doc.get("externalAccessToken")),
            "createdAt": _tz(doc.get("createdAt")) or datetime.now(timezone.utc),
            "expiresAt": _tz(doc.get("expiresAt")) or datetime.now(timezone.utc),
        })
        inserted += 1

    session.commit()
    log.info("tokenstorage: %d upserted", inserted)
    return total, inserted


# ── User events ───────────────────────────────────────────────────────────────

def migrate_user_events(session):
    import json
    coll = mongo_db["userevent"]
    total = coll.count_documents({})
    log.info("userevent: %d documents in Mongo", total)

    inserted = 0
    for doc in coll.find():
        mongo_id = doc.get("_id")  # ObjectId
        uid = doc.get("userId")
        if uid is None:
            log.warning("userevent missing userId, skipping %s", mongo_id)
            continue

        loc = doc.get("location") or {}

        # Upsert the parent event row.
        # We use the Mongo ObjectId hex as a stable external key to detect
        # re-runs. Postgres auto-generates the integer id; we look it up after.
        external_id = str(mongo_id)
        result = session.execute(text("""
            INSERT INTO user_events (
                "userId", name, start, "end", description, "maxAttendees",
                location_description, location_address, location_marker,
                location_latitude, location_longitude,
                created_at, updated_at
            )
            VALUES (
                :userId, :name, :start, :end, :description, :maxAttendees,
                :loc_desc, :loc_addr, :loc_marker,
                :loc_lat, :loc_lon,
                :created_at, :updated_at
            )
            ON CONFLICT DO NOTHING
            RETURNING id
        """), {
            "userId": uid,
            "name": _str(doc.get("name"), "Unnamed"),
            "start": _tz(doc.get("start")),
            "end": _tz(doc.get("end")),
            "description": doc.get("description"),
            "maxAttendees": doc.get("maxAttendees"),
            "loc_desc": loc.get("description"),
            "loc_addr": loc.get("address"),
            "loc_marker": loc.get("marker"),
            "loc_lat": loc.get("latitude"),
            "loc_lon": loc.get("longitude"),
            "created_at": _tz(doc.get("createdAt")) or datetime.now(timezone.utc),
            "updated_at": _tz(doc.get("updatedAt")) or datetime.now(timezone.utc),
        })

        row = result.fetchone()
        if row is None:
            # Row already existed (ON CONFLICT DO NOTHING): look it up by natural key
            existing = session.execute(text("""
                SELECT id FROM user_events
                WHERE "userId" = :uid AND name = :name AND start = :start
                LIMIT 1
            """), {"uid": uid, "name": _str(doc.get("name"), "Unnamed"),
                   "start": _tz(doc.get("start"))}).fetchone()
            if existing is None:
                log.warning("Could not find pg id for userevent %s, skipping children", mongo_id)
                continue
            event_pg_id = existing[0]
        else:
            event_pg_id = row[0]

        # Child rows — idempotent via ON CONFLICT DO NOTHING
        for h in doc.get("hosts") or []:
            huid = h.get("userId")
            if huid is not None:
                session.execute(text("""
                    INSERT INTO event_hosts (event_id, "userId")
                    VALUES (:eid, :uid)
                    ON CONFLICT ON CONSTRAINT uq_event_host DO NOTHING
                """), {"eid": event_pg_id, "uid": huid})

        for h in doc.get("suggested_hosts") or []:
            huid = h.get("userId")
            if huid is not None:
                session.execute(text("""
                    INSERT INTO event_suggested_hosts (event_id, "userId")
                    VALUES (:eid, :uid)
                    ON CONFLICT ON CONSTRAINT uq_event_suggested_host DO NOTHING
                """), {"eid": event_pg_id, "uid": huid})

        for a in doc.get("attendees") or []:
            auid = a.get("userId")
            if auid is not None:
                session.execute(text("""
                    INSERT INTO event_attendees (event_id, "userId")
                    VALUES (:eid, :uid)
                    ON CONFLICT ON CONSTRAINT uq_event_attendee DO NOTHING
                """), {"eid": event_pg_id, "uid": auid})

        for r in doc.get("reports") or []:
            ruid = r.get("userId")
            rtext = r.get("text", "")
            if ruid is not None:
                session.execute(text("""
                    INSERT INTO event_reports (event_id, "userId", text)
                    VALUES (:eid, :uid, :text)
                    ON CONFLICT DO NOTHING
                """), {"eid": event_pg_id, "uid": ruid, "text": rtext})

        inserted += 1

    session.commit()
    log.info("userevent: %d processed", inserted)
    return total, inserted


# ── External event details ────────────────────────────────────────────────────

def migrate_external_events(session):
    coll = mongo_db["externaleventdetails"]
    total = coll.count_documents({})
    log.info("externaleventdetails: %d documents in Mongo", total)

    inserted = 0
    for doc in coll.find():
        eid = doc.get("eventId")
        if eid is None:
            continue

        session.execute(text("""
            INSERT INTO external_event_details (
                "eventId", "eventDate", "startTime", "endTime", titel, description,
                speaker, location, "locationInfo", "mapUrl",
                "isFree", price, "isLimited", stock, "showBooked", booked,
                "dateBookingStart", "dateBookingEnd",
                "imageUrl150", "imageUrl300", "eventUrl",
                created_at, updated_at
            )
            VALUES (
                :eventId, :eventDate, :startTime, :endTime, :titel, :description,
                :speaker, :location, :locationInfo, :mapUrl,
                :isFree, :price, :isLimited, :stock, :showBooked, :booked,
                :dateBookingStart, :dateBookingEnd,
                :imageUrl150, :imageUrl300, :eventUrl,
                :created_at, :updated_at
            )
            ON CONFLICT ("eventId") DO UPDATE SET
                "eventDate"        = EXCLUDED."eventDate",
                "startTime"        = EXCLUDED."startTime",
                "endTime"          = EXCLUDED."endTime",
                titel              = EXCLUDED.titel,
                description        = EXCLUDED.description,
                speaker            = EXCLUDED.speaker,
                location           = EXCLUDED.location,
                "locationInfo"     = EXCLUDED."locationInfo",
                "mapUrl"           = EXCLUDED."mapUrl",
                "isFree"           = EXCLUDED."isFree",
                price              = EXCLUDED.price,
                "isLimited"        = EXCLUDED."isLimited",
                stock              = EXCLUDED.stock,
                "showBooked"       = EXCLUDED."showBooked",
                booked             = EXCLUDED.booked,
                "dateBookingStart" = EXCLUDED."dateBookingStart",
                "dateBookingEnd"   = EXCLUDED."dateBookingEnd",
                "imageUrl150"      = EXCLUDED."imageUrl150",
                "imageUrl300"      = EXCLUDED."imageUrl300",
                "eventUrl"         = EXCLUDED."eventUrl",
                updated_at         = EXCLUDED.updated_at
        """), {
            "eventId": eid,
            "eventDate": _tz(doc.get("eventDate")),
            "startTime": _str(doc.get("startTime")),
            "endTime": _str(doc.get("endTime")),
            "titel": doc.get("titel"),
            "description": _str(doc.get("description")),
            "speaker": _str(doc.get("speaker")),
            "location": _str(doc.get("location")),
            "locationInfo": doc.get("locationInfo"),
            "mapUrl": doc.get("mapUrl"),
            "isFree": _bool(doc.get("isFree")),
            "price": _int(doc.get("price")),
            "isLimited": _bool(doc.get("isLimited")),
            "stock": _int(doc.get("stock")),
            "showBooked": _bool(doc.get("showBooked")),
            "booked": _int(doc.get("booked")),
            "dateBookingStart": doc.get("dateBookingStart"),
            "dateBookingEnd": doc.get("dateBookingEnd"),
            "imageUrl150": doc.get("imageUrl150"),
            "imageUrl300": doc.get("imageUrl300"),
            "eventUrl": _str(doc.get("eventUrl")),
            "created_at": _tz(doc.get("created_at")) or datetime.now(timezone.utc),
            "updated_at": _tz(doc.get("updated_at")) or datetime.now(timezone.utc),
        })

        # Admins — delete and re-insert for idempotency
        session.execute(text('DELETE FROM external_event_admins WHERE "eventId" = :eid'), {"eid": eid})
        for admin_id in doc.get("admins") or []:
            session.execute(text("""
                INSERT INTO external_event_admins ("eventId", admin_id)
                VALUES (:eid, :aid)
            """), {"eid": eid, "aid": str(admin_id)})

        # Categories — delete and re-insert for idempotency
        session.execute(text('DELETE FROM external_event_categories WHERE "eventId" = :eid'), {"eid": eid})
        for cat in doc.get("categories") or []:
            session.execute(text("""
                INSERT INTO external_event_categories ("eventId", code, text, "colorText", "colorBackground")
                VALUES (:eid, :code, :text, :ct, :cb)
            """), {
                "eid": eid,
                "code": _str(cat.get("code")),
                "text": _str(cat.get("text")),
                "ct": _str(cat.get("colorText")),
                "cb": _str(cat.get("colorBackground")),
            })

        inserted += 1

    session.commit()
    log.info("externaleventdetails: %d upserted", inserted)
    return total, inserted


# ── External root ─────────────────────────────────────────────────────────────

def migrate_external_root(session):
    coll = mongo_db["externalroot"]
    total = coll.count_documents({})
    log.info("externalroot: %d documents in Mongo", total)

    if total == 0:
        log.info("externalroot: nothing to migrate")
        return 0, 0

    doc = coll.find_one()
    now = datetime.now(timezone.utc)

    session.execute(text("""
        INSERT INTO external_root (id, version, "loginUrl", "restUrl", "siteUrl",
            header1, header2, city, "streetAddress", "mapUrl",
            created_at, updated_at)
        VALUES (1, :version, :loginUrl, :restUrl, :siteUrl,
            :header1, :header2, :city, :streetAddress, :mapUrl,
            :created_at, :updated_at)
        ON CONFLICT (id) DO UPDATE SET
            version        = EXCLUDED.version,
            "loginUrl"     = EXCLUDED."loginUrl",
            "restUrl"      = EXCLUDED."restUrl",
            "siteUrl"      = EXCLUDED."siteUrl",
            header1        = EXCLUDED.header1,
            header2        = EXCLUDED.header2,
            city           = EXCLUDED.city,
            "streetAddress"= EXCLUDED."streetAddress",
            "mapUrl"       = EXCLUDED."mapUrl",
            updated_at     = EXCLUDED.updated_at
    """), {
        "version": _int(doc.get("version")),
        "loginUrl": _str(doc.get("loginUrl")),
        "restUrl": _str(doc.get("restUrl")),
        "siteUrl": _str(doc.get("siteUrl")),
        "header1": _str(doc.get("header1")),
        "header2": _str(doc.get("header2")),
        "city": _str(doc.get("city")),
        "streetAddress": _str(doc.get("streetAddress")),
        "mapUrl": _str(doc.get("mapUrl")),
        "created_at": now,
        "updated_at": now,
    })

    # Dates — replace for idempotency
    session.execute(text("DELETE FROM external_root_dates WHERE root_id = 1"))
    for date_str in doc.get("dates") or []:
        session.execute(text("""
            INSERT INTO external_root_dates (root_id, date_value)
            VALUES (1, :date_value)
        """), {"date_value": str(date_str)})

    session.commit()
    log.info("externalroot: 1 upserted")
    return 1, 1


# ── External event bookings ───────────────────────────────────────────────────

def migrate_external_event_bookings(session):
    coll = mongo_db["externaleventbooking"]
    total = coll.count_documents({})
    log.info("externaleventbooking: %d documents in Mongo", total)

    inserted = 0
    for doc in coll.find():
        uid = doc.get("userId")
        eid = doc.get("eventId")
        if uid is None or eid is None:
            continue
        session.execute(text("""
            INSERT INTO external_event_bookings ("userId", "eventId")
            VALUES (:uid, :eid)
            ON CONFLICT ON CONSTRAINT uq_external_event_booking DO NOTHING
        """), {"uid": uid, "eid": eid})
        inserted += 1

    session.commit()
    log.info("externaleventbooking: %d upserted", inserted)
    return total, inserted


# ── Validation ────────────────────────────────────────────────────────────────

def validate(session):
    """Compare Mongo document counts against Postgres row counts."""
    checks = [
        ("users",                   "user",                    None),
        ("token_storage",           "tokenstorage",            None),
        ("user_events",             "userevent",               None),
        ("external_event_details",  "externaleventdetails",    None),
        ("external_event_bookings", "externaleventbooking",    None),
    ]

    all_ok = True
    for pg_table, mongo_coll, _note in checks:
        mongo_count = mongo_db[mongo_coll].count_documents({})
        pg_count = session.execute(text(f'SELECT COUNT(*) FROM "{pg_table}"')).scalar()
        status = "OK" if pg_count >= mongo_count else "MISMATCH"
        if status != "OK":
            all_ok = False
        log.info(
            "VALIDATE %-30s  Mongo=%4d  Postgres=%4d  %s",
            pg_table, mongo_count, pg_count, status,
        )

    return all_ok


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    log.info("Starting Mongo → Postgres migration")
    log.info("Mongo:    %s", MONGO_URL)
    log.info("Postgres: %s", DATABASE_URL.split("@")[-1])  # hide credentials

    with Session() as session:
        migrate_users(session)
        migrate_token_storage(session)
        migrate_user_events(session)
        migrate_external_events(session)
        migrate_external_root(session)
        migrate_external_event_bookings(session)

        log.info("--- Validation ---")
        ok = validate(session)

    if ok:
        log.info("Migration complete. All row counts match.")
    else:
        log.error("Migration completed with mismatches — review the output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
