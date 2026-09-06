import logging
from typing import List
from sqlalchemy import or_
from v1.db.models.external_events import ExternalEventDetails, ExternalRoot
from v1.db.database import get_session
from v1.db.tables import (
    ExternalEventDetailsTable, ExternalEventAdminTable, ExternalEventCategoryTable,
    ExternalRootTable, ExternalRootDateTable,
)


def store_external_root(root: ExternalRoot):
    """Stores or replaces the external root details."""
    try:
        root_dict = root.model_dump()
        with get_session() as session:
            existing = session.query(ExternalRootTable).first()
            if existing:
                for key in ("version", "loginUrl", "restUrl", "siteUrl", "header1", "header2", "city", "streetAddress", "mapUrl"):
                    setattr(existing, key, root_dict[key])
                existing.dates.clear()
                for d in root_dict.get("dates", []):
                    existing.dates.append(ExternalRootDateTable(root_id=existing.id, date_value=d))
            else:
                row = ExternalRootTable(
                    version=root_dict["version"],
                    loginUrl=root_dict["loginUrl"],
                    restUrl=root_dict["restUrl"],
                    siteUrl=root_dict["siteUrl"],
                    header1=root_dict["header1"],
                    header2=root_dict["header2"],
                    city=root_dict["city"],
                    streetAddress=root_dict["streetAddress"],
                    mapUrl=root_dict["mapUrl"],
                )
                session.add(row)
                session.flush()
                for d in root_dict.get("dates", []):
                    session.add(ExternalRootDateTable(root_id=row.id, date_value=d))
            session.commit()
        logging.info("Successfully stored external root details.")
    except Exception as e:
        logging.error(f"Failed to store external root details: {e}")


def get_stored_external_root() -> ExternalRoot | None:
    """Retrieves the stored external root details."""
    try:
        with get_session() as session:
            row = session.query(ExternalRootTable).first()
            if row:
                return ExternalRoot(**row.to_dict())
            else:
                logging.info("No external root data found.")
                return None
    except Exception as e:
        logging.error(f"Failed to retrieve external root details: {e}")
        return None


def store_external_event_details(events: List[ExternalEventDetails]):
    """Stores external event details (upsert), one transaction per event."""
    for event in events:
        event_dict = event.model_dump()
        logging.info(f"Storing event: {event_dict['titel']}")
        try:
            with get_session() as session:
                existing = session.query(ExternalEventDetailsTable).filter_by(
                    eventId=event_dict["eventId"]
                ).first()

                if existing:
                    for key in ("eventDate", "startTime", "endTime", "titel", "description",
                                "speaker", "location", "locationInfo", "mapUrl",
                                "isFree", "price", "isLimited", "stock", "showBooked",
                                "booked", "dateBookingStart", "dateBookingEnd",
                                "imageUrl150", "imageUrl300", "eventUrl"):
                        setattr(existing, key, event_dict.get(key))

                    existing.admins.clear()
                    for admin_id in event_dict.get("admins") or []:
                        existing.admins.append(ExternalEventAdminTable(eventId=existing.eventId, admin_id=admin_id))

                    existing.categories.clear()
                    for cat in event_dict.get("categories") or []:
                        existing.categories.append(ExternalEventCategoryTable(
                            eventId=existing.eventId, **cat
                        ))
                else:
                    row = ExternalEventDetailsTable(
                        eventId=event_dict["eventId"],
                        eventDate=event_dict.get("eventDate"),
                        startTime=event_dict["startTime"],
                        endTime=event_dict["endTime"],
                        titel=event_dict.get("titel"),
                        description=event_dict["description"],
                        speaker=event_dict["speaker"],
                        location=event_dict["location"],
                        locationInfo=event_dict.get("locationInfo"),
                        mapUrl=event_dict.get("mapUrl"),
                        isFree=event_dict["isFree"],
                        price=event_dict["price"],
                        isLimited=event_dict["isLimited"],
                        stock=event_dict["stock"],
                        showBooked=event_dict["showBooked"],
                        booked=event_dict["booked"],
                        dateBookingStart=event_dict.get("dateBookingStart"),
                        dateBookingEnd=event_dict.get("dateBookingEnd"),
                        imageUrl150=event_dict.get("imageUrl150"),
                        imageUrl300=event_dict.get("imageUrl300"),
                        eventUrl=event_dict["eventUrl"],
                    )
                    session.add(row)
                    session.flush()

                    for admin_id in event_dict.get("admins") or []:
                        session.add(ExternalEventAdminTable(eventId=row.eventId, admin_id=admin_id))

                    for cat in event_dict.get("categories") or []:
                        session.add(ExternalEventCategoryTable(eventId=row.eventId, **cat))

                session.commit()
        except Exception as e:
            logging.error(f"Failed to insert/update event {event_dict.get('eventId')}: {e}")


def get_stored_external_event_details(
        event_ids: List[int],
        host_id: int = None,
    ) -> List[ExternalEventDetails]:
    """Retrieves external event details by event IDs or admin host ID."""
    try:
        with get_session() as session:
            conditions = [ExternalEventDetailsTable.eventId.in_(event_ids)]
            if host_id is not None:
                # Find events where host_id is an admin
                admin_event_ids = [
                    row.eventId for row in
                    session.query(ExternalEventAdminTable.eventId).filter(
                        ExternalEventAdminTable.admin_id == str(host_id)
                    ).all()
                ]
                if admin_event_ids:
                    conditions.append(ExternalEventDetailsTable.eventId.in_(admin_event_ids))

            rows = session.query(ExternalEventDetailsTable).filter(
                or_(*conditions)
            ).all()
            return [ExternalEventDetails(**row.to_dict()) for row in rows]
    except Exception as e:
        logging.error(f"Failed to retrieve events: {e}")
        return []


def get_all_stored_external_event_details() -> List[ExternalEventDetails]:
    """Return all stored external events."""
    try:
        with get_session() as session:
            rows = session.query(ExternalEventDetailsTable).all()
            return [ExternalEventDetails(**row.to_dict()) for row in rows]
    except Exception as e:
        logging.error(f"Failed to retrieve all external events: {e}")
        return []


def clean_external_events(keeping: List[ExternalEventDetails]):
    """Deletes external events not in the keeping list."""
    try:
        keeping_ids = [event.eventId for event in keeping]
        with get_session() as session:
            session.query(ExternalEventDetailsTable).filter(
                ~ExternalEventDetailsTable.eventId.in_(keeping_ids)
            ).delete(synchronize_session="fetch")
            session.commit()
        logging.info("Successfully cleaned external events.")
    except Exception as e:
        logging.error(f"Failed to clean external events: {e}")
