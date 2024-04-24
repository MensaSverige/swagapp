from pymongo import MongoClient
from env_constants import TEST_MODE
from db.test_data import generate_fake_users
import logging
from typing import Type
from pydantic import BaseModel
from db.models.tokenstorage import TokenStorage
from db.models.user import User
from user_events.user_events_model import UserEvent
from db.models.external_events import ExternalEventDetails
from db.review_users import review_users

logging.basicConfig(level=logging.INFO)


def get_collection_name(model_type):
    return model_type.__name__.lower()


client = MongoClient('mongo', 27017)
db = client['swag']
user_collection = db[get_collection_name(User)]
tokenstorage_collection = db[get_collection_name(TokenStorage)]
user_event_collection = db[get_collection_name(UserEvent)]
external_event_collection = db[get_collection_name(ExternalEventDetails)]


def initialize_db():

    try:
        logging.info("Connected to the database.")
        #list all collections
        collections = db.list_collection_names()
        logging.info(f"Database collections: {collections}")

        initialize_collection(User, db)
        user_collection.create_index("userId", unique=True)

        initialize_collection(TokenStorage, db)
        tokenstorage_collection.create_index("userId", unique=True)

        initialize_collection(ExternalEventDetails, db)
        external_event_collection.create_index("eventId", unique=True)

        initialize_collection(UserEvent, db)

        # Check if in local test mode
        if TEST_MODE.lower() == 'true':
            #first clear the collections
            #user_collection.delete_many({})
            #tokenstorage_collection.delete_many({})
            logging.info("Cleared all collections.")

            # Generate and add fake users to the database
            # fake_users = generate_fake_users(10)  # Generate 10 fake users
            # logging.info("Adding fake users to the database.")
            # user_collection.insert_many(
            #     [user.model_dump() for user in fake_users])

        # Ensure review users exist, if configured
        if not review_users:
            logging.info("No review users found. Adding default review users.")
        else:
            logging.info("Review users found.")
            for review_user in review_users:
                user_collection.update_one({"userId": review_user.userId},
                                           {"$set": review_user.model_dump()},
                                           upsert=True)

    except Exception as e:
        logging.error("Failed to connect to the database: %s", e)


def initialize_collection(model: Type[BaseModel], db):
    """
    Initializes a MongoDB collection based on a Pydantic model. The collection name is derived from the model class name.

    :param model: Pydantic model class.
    :param db: The MongoDB database object.
    """
    # Derive collection name from the model class name, convert to lowercase
    collection_name = get_collection_name(model)
    if collection_name not in db.list_collection_names():
        logging.info(f"Creating collection: {collection_name}")
        db.create_collection(collection_name)
    else:
        logging.info(f"Collection {collection_name} already exists.")
