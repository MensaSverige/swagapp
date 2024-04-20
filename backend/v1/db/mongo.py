from pymongo import MongoClient
import os
from env_constants import TEST_MODE
from db.test_data import generate_fake_users
import logging
from typing import Type
from pydantic import BaseModel
from db.models.tokenstorage import TokenStorage
from db.models.user import User
from user_events.user_events_model import UserEvent

logging.basicConfig(level=logging.INFO)
client = MongoClient('mongo', 27017)
db = client['swag']
user_collection = db['user']
tokenstorage_collection = db['tokenstorage']
user_event_collection = db['userevents']


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

        initialize_collection(UserEvent, db)


        # Check if in local test mode
        if TEST_MODE.lower() == 'true':
            #first clear the collections
            user_collection.delete_many({})
            tokenstorage_collection.delete_many({})
            logging.info("Cleared all collections.")

            # Generate and add fake users to the database
            fake_users = generate_fake_users(10)  # Generate 10 fake users
            logging.info("Adding fake users to the database.")
            user_collection.insert_many([user.model_dump() for user in fake_users])


    except Exception as e:
        logging.error("Failed to connect to the database: %s", e)


def initialize_collection(model: Type[BaseModel], db):
    """
    Initializes a MongoDB collection based on a Pydantic model. The collection name is derived from the model class name.

    :param model: Pydantic model class.
    :param db: The MongoDB database object.
    """
    # Derive collection name from the model class name, convert to lowercase
    model_name = model.__name__.lower()
    if model_name not in db.list_collection_names():
        logging.info(f"Creating collection: {model_name}")
        db.create_collection(model_name)
    else:
        logging.info(f"Collection {model_name} already exists.")
