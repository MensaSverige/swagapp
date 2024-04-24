import logging
from db.models.external_events import ExternalEventDetails
from typing import List, Optional
from db.mongo import external_event_collection

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


def get_stored_external_event_details(event_ids: List[int]) -> List[ExternalEventDetails]:
    """
    Retrieves external event details from the MongoDB database.

    :param event_ids: The external event IDs.
    :return: The external event details.
    """
    try:
        return [ExternalEventDetails(**event) for event in external_event_collection.find({'eventId': {'$in': event_ids}})]
    except Exception as e:
        logging.error(f"Failed to retrieve events: {e}")
        return []