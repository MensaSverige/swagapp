from datetime import datetime
import logging
from typing import List
from bson import ObjectId
from user_events.user_events_model import ExtendedUserEvent, UserEvent
from db.mongo import user_event_collection, user_collection


def create_user_event(user_event: dict) -> ObjectId:
    """
    Create a new user event.

    :param user_event: User event data.
    :return: The created user event ID as ObjectId.
    """
    result = user_event_collection.insert_one(user_event.model_dump())
    return result.inserted_id


def get_unsafe_user_event(event_id: str) -> UserEvent | None:
    """
    Retrieves a user event document from the MongoDB database.
    This function should only be used for internal operations, as it returns secret fields.

    :param event_id: The event ID.
    :return: The user event document or None.
    """

    event = user_event_collection.find_one({"id": ObjectId(event_id)})

    logging.info(f"Event: {type(event)} {event}")
    return UserEvent(**event) if event else None


def get_safe_user_event(event_id: str) -> ExtendedUserEvent | None:
    """
    Retrieves a user event document from the MongoDB database, without secret fields.

    :param event_id: The event ID.
    :return: The user event document or None.
    """

    event = get_unsafe_user_event(event_id)
    if not event:
        return None

    return extend_user_events([make_user_event_safe(event)])[0]


def update_user_event(event_id: str, user_event: UserEvent) -> bool:
    """
    Updates a user event document in the MongoDB database.

    :param event_id: The event ID.
    :param user_event: The updated user event data.
    :return: The number of modified documents.
    """

    # The incoming user event won't contain any of the secret fields,
    # so we need to copy them from the existing event before updating.
    event = restore_secret_fields_on_user_event(user_event)
    if not event:
        return 0

    result = user_event_collection.update_one({"id": ObjectId(event_id)},
                                              {"$set": event.model_dump()})
    return result.acknowledged and result.matched_count > 0


def delete_user_event(event_id: str) -> bool:
    """
    Deletes a user event document from the MongoDB database.

    :param event_id: The event ID.
    :return: The number of deleted documents.
    """
    result = user_event_collection.delete_one({"id": ObjectId(event_id)})
    return result.acknowledged


def get_unsafe_future_user_events() -> list[UserEvent]:
    """
    Retrieves all future user events from the MongoDB database.
    This function should only be used for internal operations, as it returns secret fields.

    :return: The user event documents.
    """
    query = {
        "$or": [{
            "end": {
                "$gte": datetime.now()
            }
        }, {
            "start": {
                "$gte": datetime.now()
            }
        }]
    }

    return [UserEvent(**event) for event in user_event_collection.find(query)]


def get_safe_future_user_events() -> list[ExtendedUserEvent]:
    """
    Retrieves all future user events from the MongoDB database.
    :return: The user event documents.
    """

    return extend_user_events(
        remove_secrets_from_user_events(get_unsafe_future_user_events()))


def get_unsafe_user_events_user_owns(userId: int) -> list[UserEvent]:
    """
    Retrieves all user events that a user is hosting.
    This function should only be used for internal operations, as it returns secret fields.

    :param userId: The ID of the user.
    :return: The user event documents.
    """
    query = {"userId": userId}
    return [UserEvent(**event) for event in user_event_collection.find(query)]


def get_safe_user_events_user_owns(userId: int) -> list[ExtendedUserEvent]:
    """
    Retrieves all user events that a user is hosting.

    :param userId: The ID of the user.
    :return: The user event documents.
    """

    return extend_user_events(
        remove_secrets_from_user_events(
            get_unsafe_user_events_user_owns(userId)))


def get_unsafe_user_events_user_is_hosting(userId: int) -> list[UserEvent]:
    """
    Retrieves all user events that a user is hosting.
    This function should only be used for internal operations, as it returns secret fields.

    :param userId: The ID of the user.
    :return: The user event documents.
    """
    query = {"hosts": {"$elemMatch": {"userId": userId}}}
    return [UserEvent(**event) for event in user_event_collection.find(query)]


def get_safe_user_events_user_is_hosting(
        userId: int) -> list[ExtendedUserEvent]:
    """
    Retrieves all user events that a user is hosting.

    :param userId: The ID of the user.
    :return: The user event documents.
    """

    return extend_user_events(
        remove_secrets_from_user_events(
            get_unsafe_user_events_user_is_hosting(userId)))


def get_unsafe_user_events_user_is_attending(userId: int) -> list[UserEvent]:
    """
    Retrieves all user events that a user is attending.
    This function should only be used for internal operations, as it returns secret fields.

    :param userId: The ID of the user.
    :return: The user event documents.
    """
    query = {"attendees": {"$elemMatch": {"userId": userId}}}
    return [UserEvent(**event) for event in user_event_collection.find(query)]


def get_safe_user_events_user_is_attending(
        userId: int) -> list[ExtendedUserEvent]:
    """
    Retrieves all user events that a user is attending.

    :param userId: The ID of the user.
    :return: The user event documents.
    """
    return extend_user_events(
        remove_secrets_from_user_events(
            get_unsafe_user_events_user_is_attending(userId)))


def add_attendee_to_user_event(event_id: str, user_id: int) -> bool:
    """
    Adds a user to the attendees list of an event, ensuring no duplicates.

    :param event_id: The ID of the event.
    :param user_id: The ID of the user to add.
    :return: The number of modified documents.
    """
    event = get_unsafe_user_event(event_id)
    if event and "max_attendees" in event and len(
            event["attendees"]) >= event["max_attendees"]:
        return 0
    result = user_event_collection.update_one(
        {"id": ObjectId(event_id)},
        {"$addToSet": {
            "attendees": {
                "userId": user_id
            }
        }})
    return result.acknowledged and result.matched_count > 0


def remove_attendee_from_user_event(event_id: str, user_id: int) -> bool:
    """
    Removes a user from the attendees list of an event.

    :param event_id: The ID of the event.
    :param user_id: The ID of the user to remove.
    :return: The number of modified documents.
    """
    result = user_event_collection.update_one(
        {"id": ObjectId(event_id)},
        {"$pull": {
            "attendees": {
                "userId": user_id
            }
        }})
    return result.acknowledged and result.matched_count > 0


### Hosts and host invites ###


def get_unsafe_user_events_user_is_invited_to_host(
        userId: int) -> list[UserEvent]:
    """
    Retrieves all user events that a user is suggested to co-host.
    This function should only be used for internal operations, as it returns secret fields.

    :param userId: The ID of the user.
    :return: The user event documents.
    """
    query = {"suggested_hosts": {"$elemMatch": {"userId": userId}}}
    return [UserEvent(**event) for event in user_event_collection.find(query)]


def get_safe_user_events_user_is_invited_to_host(
        userId: int) -> list[ExtendedUserEvent]:
    """
    Retrieves all user events that a user is suggested to co-host.

    :param userId: The ID of the user.
    :return: The user event documents.
    """
    return extend_user_events(
        remove_secrets_from_user_events(
            get_unsafe_user_events_user_is_invited_to_host(userId)))


def add_user_as_host_to_user_event(event_id: str, user_id: int) -> bool:
    """
    Adds a user to the hosts list of an event, ensuring no duplicates.

    :param event_id: The ID of the event.
    :param user_id: The ID of the user to add.
    :return: The number of modified documents.
    """
    result = user_event_collection.update_one({"id": ObjectId(event_id)}, {
        "$addToSet": {
            "hosts": {
                "userId": user_id
            }
        },
        "$pull": {
            "suggested_hosts": {
                "userId": user_id
            }
        }
    })
    return result.acknowledged and result.matched_count > 0


def remove_user_from_hosts_of_user_event(event_id: str, user_id: int) -> bool:
    """
    Removes a user from the hosts list of an event.

    :param event_id: The ID of the event.
    :param user_id: The ID of the user to remove.
    :return: The number of modified documents.
    """
    result = user_event_collection.update_one(
        {"id": ObjectId(event_id)}, {"$pull": {
            "hosts": {
                "userId": user_id
            }
        }})
    return result.acknowledged and result.matched_count > 0


def remove_user_host_invitation_from_user_event(event_id: str,
                                                user_id: int) -> bool:
    """
    Removes a user from the suggested hosts list of an event.

    :param event_id: The ID of the event.
    :param user_id: The ID of the user to remove.
    :return: The number of modified documents.
    """
    result = user_event_collection.update_one(
        {"id": ObjectId(event_id)},
        {"$pull": {
            "suggested_hosts": {
                "userId": user_id
            }
        }})
    return result.acknowledged and result.matched_count > 0


### Reports ###


def add_or_update_report_on_user_event(event_id: str, user_id: int,
                                       report: str) -> bool:
    """
    Adds a report to an event, or updates an existing report.

    :param event_id: The ID of the event.
    :param user_id: The ID of the user making the report.
    :param report: The report text.
    :return: The number of modified documents.
    """

    result = user_event_collection.update_one(
        {"id": ObjectId(event_id)}, {"$set": {
            "reports.$[elem].text": report
        }},
        array_filters=[{
            "elem.userId": user_id
        }])

    if result.modified_count == 0:
        result = user_event_collection.update_one(
            {"id": ObjectId(event_id)},
            {"$addToSet": {
                "reports": {
                    "userId": user_id,
                    "text": report
                }
            }})

    return result.acknowledged and result.matched_count > 0


def remove_report_from_user_event(event_id: str, user_id: int) -> bool:
    """
    Removes a report from an event.

    :param event_id: The ID of the event.
    :param user_id: The ID of the user making the report.
    :return: The number of modified documents.
    """
    result = user_event_collection.update_one(
        {"id": ObjectId(event_id)},
        {"$pull": {
            "reports": {
                "userId": user_id
            }
        }})
    return result.acknowledged and result.matched_count > 0


### Utilities ###


def extend_user_events(events: List[UserEvent]) -> List[ExtendedUserEvent]:

    # Fetch user IDs
    user_ids = set()
    for event in events:
        user_ids.add(event.userId)
        user_ids.update(host.userId for host in event.hosts)
        user_ids.update(attendee.userId for attendee in event.attendees)

    user_ids = list(user_ids)

    # Fetch user names
    user_names = {}
    users = user_collection.find({"userId": {"$in": user_ids}})

    for user in users:
        user_id = user["userId"]
        user_names[user_id] = f"{user['firstName']} {user['lastName']}"

    def extend_user_event(event: dict,
                          user_names: dict[int, str]) -> ExtendedUserEvent:
        """
        Extends a user event document with user names.

        :param event: The user event document.
        :param user_names: A dictionary of user IDs and names.
        :return: The extended user event document.
        """
        event["ownerName"] = user_names[event["userId"]]
        event["hostNames"] = [
            user_names[host["userId"]] for host in event["hosts"]
        ]
        event["attendeeNames"] = [
            user_names[attendee["userId"]] for attendee in event["attendees"]
        ]

        return ExtendedUserEvent(**event)

    event_dicts = [event.model_dump() for event in events]
    return [
        extend_user_event(event_dict, user_names) for event_dict in event_dicts
    ]


def make_user_event_safe(event: UserEvent) -> UserEvent:
    """
    Set secret fields to their model default values in a user event document, to make it safe to return to the client.

    :param event: The user event document.
    :return: The user event document with secrets removed.
    """
    event.reports = []

    return event


def remove_secrets_from_user_events(
        events: list[UserEvent]) -> list[UserEvent]:
    """
    Set secret fields to their model default values in a list of user event documents.

    :param events: The user event documents.
    :return: The user event documents with secrets removed.
    """
    return [make_user_event_safe(event) for event in events]


def restore_secret_fields_on_user_event(event: UserEvent) -> UserEvent | None:
    """
    Restore secret fields to their original values in a user event document.

    :param event: The user event document.
    :param original_event: The original user event document.
    :return: The user event document with secrets restored.
    """

    original_event = get_unsafe_user_event(event.id)

    if not original_event:
        return None

    event.reports = original_event.reports

    return event
