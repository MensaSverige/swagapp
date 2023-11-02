import os
import json
from pymongo import MongoClient
import logging

logging.basicConfig(level=logging.INFO)


def initialize_collection_from_schema(model_name, schema_file_path, db):
    with open(schema_file_path) as f:
        schema = json.load(f)

    # Initialize MongoDB collection if it doesn't exist
    if model_name not in db.list_collection_names():
        logging.info(f"Creating collection {model_name}")
        db.create_collection(model_name)
    else:
        logging.info(f"Collection {model_name} already exists")

    collection = db[model_name]

    # TODO: Here, you might want to apply schema validations using MongoDB capabilities if needed

    return schema, collection
