import logging
from typing import List
from v1.db.models.external_events import ExternalEventDetails, ExternalRoot
from v1.db.mongo import external_event_collection, external_root_collection


def store_external_root(root: ExternalRoot):
    """
    Stores the external root details in the MongoDB database.

    :param root: The external root details.
    """
    try:
        root_dict = root.model_dump()
        external_root_collection.update_one(
            {},  # empty filter to match all documents
            {'$set': root_dict},  # update
            upsert=True  # insert if doesn't exist
        )
        logging.info("Successfully stored external root details.")
    except Exception as e:
        logging.error(f"Failed to store external root details: {e}")

def get_stored_external_root() -> ExternalRoot:
    """
    Retrieves the stored external root details from the MongoDB database.

    :return: The external root details.
    """
    try:
        root_data = external_root_collection.find_one({})
        if root_data:
            return ExternalRoot(**root_data)
        else:
            logging.info("No external root data found.")
            return None
    except Exception as e:
        logging.error(f"Failed to retrieve external root details: {e}")
        return None


def store_external_event_details(events: List[ExternalEventDetails]):
    """
    Stores external event details in the MongoDB database.

    :param event: The external event details.
    """
    # not yet sure if i want to update or not so thats why this is still here.
    # try:
    #     external_event_collection.insert_many(event.model_dump() for event in events)
    # except Exception as e:
    #     logging.error(f"Failed to insert events: {e}")

    ## Update the existing event if it exists, otherwise insert a new event
    try:
        for event in events:
            event_dict = event.model_dump()
            external_event_collection.update_one(
                {'eventId': event_dict['eventId']},  # filter
                {'$set': event_dict},  # update
                upsert=True  # insert if doesn't exist
            )
    except Exception as e:
        logging.error(f"Failed to insert/update events: {e}")


def get_stored_external_event_details(
        event_ids: List[int],
        host_id: int = None,
    ) -> List[ExternalEventDetails]:
    """
    Retrieves external event details from the MongoDB database.

    :param event_ids: The external event IDs.
    :return: The external event details.
    """
    try:
        return [
            ExternalEventDetails(**event) for event in
            external_event_collection.find({
                "$or": [
                    {"eventId": {"$in": event_ids}},
                    {"admins": f"{host_id}"}
                ]
            })
        ]
    except Exception as e:
        logging.error(f"Failed to retrieve events: {e}")
        return []
