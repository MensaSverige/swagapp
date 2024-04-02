from pymongo import MongoClient
import logging
from typing import Type
from pydantic import BaseModel
from db.models.user import User

logging.basicConfig(level=logging.INFO)
client = MongoClient('mongo', 27017)
db = client['swag']
user_collection = db['user']

def initialize_db():

    try:
        logging.info("Connected to the database.")
        #list all collections
        collections = db.list_collection_names()
        logging.info(f"Database collections: {collections}")
        
        initialize_collection(User, db)
    except Exception as e:
        logging.error("Failed to connect to the database: %s", e)
    

def initialize_collection(model: Type[BaseModel], db):
    """
    Initializes a MongoDB collection based on a Pydantic model. The collection name is derived from the model class name.

    :param model: Pydantic model class.
    :param db: The MongoDB database object.
    """
    model_name = model.__name__.lower()  # Derive collection name from the model class name, convert to lowercase
    if model_name not in db.list_collection_names():
        logging.info(f"Creating collection: {model_name}")
        db.create_collection(model_name)
    else:
        logging.info(f"Collection {model_name} already exists.")