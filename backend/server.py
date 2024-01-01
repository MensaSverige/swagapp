"""
This module contains the server implementation for the SwagApp backend.

The server is built using Flask, a lightweight web framework for Python.
It provides various endpoints for handling CRUD operations on different models,
such as creating, reading, updating, and deleting items.

The server also includes authentication and authorization mechanisms using JWT tokens.
It uses JSON schemas for validating the request payloads and interacts with a MongoDB database.

Additionally, the server has endpoints for health checks, refreshing access tokens,
listing static events, retrieving users showing their location, and updating user locations.

The module also includes helper functions for logging, endpoint registration, and error handling.

Note: The app is not started in this module. Instead, it is started in the wsgi.py :func:`wsgi` module.
"""

import datetime
import logging
import sys
import jsonschema
import json
import os
from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
from bson.errors import InvalidId
from functools import partial
from token_processing import requires_auth, create_access_token, verify_refresh_token
from auth import auth_endpoint
from mongo import initialize_collection_from_schema
from werkzeug.routing import Rule
from bson_to_json import bson_to_json

# Initialize logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
db = None
client = None
schema_dir = os.path.join(os.path.dirname(__file__), 'schema')


# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    """
    Endpoint for health check.

    Retrieves commit information from environment variables and constructs a commit URL using the commit hash.
    Returns the health check response with commit information.

    :returns: A JSON response containing the health check information.
    :rtype: flask.Response
    """
    logging.info(f"health: {request.method} {request.path}")

    # Retrieve commit information from environment variables
    commit_message = os.getenv('GIT_COMMIT_INFO', 'Unknown')
    commit_hash = os.getenv('GIT_COMMIT_HASH', 'Unknown')

    # Construct commit URL using the commit hash
    commit_url = f"https://github.com/skaramicke/swagapp/commit/{commit_hash}"

    # Return the health check response with commit information
    return jsonify({
        'status': 'healthy',
        'commit_message': commit_message,
        'commit_url': commit_url
    }), 200


@app.route('/refresh_token', methods=['POST'])
def refresh_token():
    """
    Refreshes the access token using the provided refresh token.

    :returns: A JSON response containing the new access token.
    :rtype: flask.Response

    :raises: json.decoder.JSONDecodeError: If the request body is not valid JSON.
    """
    refresh_token = request.json.get('refresh_token')
    if not refresh_token:
        return jsonify({'error': 'Missing refresh token'}), 400

    valid, payload = verify_refresh_token(refresh_token)
    if not valid:
        logging.error(f"Invalid refresh token: {refresh_token}")
        return jsonify({'error': 'Invalid refresh token'}), 401

    new_access_token = create_access_token(payload['sub'])
    return jsonify({'access_token': new_access_token})


@requires_auth
def create(model_name, schema, collection, username):
    """
    Create a new item in the specified collection.

    :param model_name: The name of the model.
    :type model_name: str
    :param schema: The JSON schema for validating the item.
    :type schema: dict
    :param collection: The collection object to insert the item into.
    :type collection: pymongo.collection.Collection
    :param username: The username of the owner.
    :type username: str
    :returns: A tuple containing the JSON response and the HTTP status code.
    :rtype: tuple
    :raises jsonschema.ValidationError: If the item fails validation against the schema.
    """

    logging.info(f"create: {request.method} {request.path}")
    try:
        item = request.json

        if schema['properties'].get('owner', None):
            item['owner'] = username

        jsonschema.validate(instance=item, schema=schema)
        collection.insert_one(item)
        logging.info(f"Item successfully created in {model_name}")
        return jsonify({'status': 'success'}), 201
    except jsonschema.ValidationError as e:
        logging.error(f"Validation Error in POST /{model_name}: {str(e)}")
        return jsonify({'error': str(e)}), 400


@requires_auth
def read(model_name, collection, username, item_id=None):
    """
    Retrieve data from the collection based on the given model name, username, and item ID (optional).

    :param model_name: The name of the model.
    :type model_name: str
    :param collection: The collection to retrieve data from.
    :type collection: pymongo.collection.Collection
    :param username: The username associated with the item.
    :type username: str
    :param item_id: The ID of the item to retrieve.
    :type item_id: str
    :returns: A tuple containing the JSON response and the HTTP status code.
    :rtype: tuple
    """

    if model_name == 'event':
        logging.info("Skipping user events for review purposes.")
        return jsonify([]), 200

    logging.info(f"read: {request.method} {request.path}")

    if model_name == 'event':
        logging.info("Event mirrors user event for backend compatibility")
        model_name = 'user_event'

    try:
        if item_id:

            if model_name == 'user' and item_id == 'me':
                item = collection.find_one({'username': username})
            else:
                item = collection.find_one({'_id': ObjectId(item_id)})

            if not item:
                logging.error(f"Item not found in GET /{model_name}")
                return jsonify({'error': 'Item not found'}), 404

            logging.info(
                f"Item successfully retrieved from {model_name}: {item}")

            return jsonify(bson_to_json(item)), 200

        else:
            items = list(collection.find())
            logging.info(
                f"Items successfully retrieved from {model_name}: {items}")
            return jsonify(bson_to_json(items)), 200

    except Exception as e:
        logging.error(f"Error in GET /{model_name}: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500


@requires_auth
def update(model_name, schema, collection, item_id, username):
    """
    Update an item in the collection based on the provided model name, schema, item ID, and username.

    :param model_name: The name of the model.
    :type model_name: str
    :param schema: The JSON schema, used to check if the item is owned by matching the username.
    :type schema: dict
    :param collection: The collection to update the item in.
    :type collection: pymongo.collection.Collection
    :param item_id: The ID of the item to update.
    :type item_id: str
    :param username: The username of the authorized user.
    :type username: str
    :returns: A JSON response containing the updated item or an error message.
    :rtype: flask.Response
    :raises jsonschema.ValidationError: If there is a validation error.
    """

    logging.info(f"update: {request.method} {request.path}")
    try:
        # If item.owner exists, check if authorized user is owner
        if 'owner' in schema['properties']:
            item = collection.find_one({'_id': ObjectId(item_id)})
            if item['owner'] != username:
                logging.error(
                    f"User {username} is not the owner of item {item_id}")
                return jsonify({'error': 'Unauthorized'}), 401

        # If model is user and username does not match, return unauthorized
        if model_name == 'user':
            if item_id == 'me':
                item = collection.find_one({'username': username})
                if item:
                    item_id = item['_id']
            else:
                item = collection.find_one({'_id': ObjectId(item_id)})

            if not item:
                logging.error(f"Item {item_id} not found in GET /{model_name}")
                return jsonify({'error': 'Item not found'}), 404

            if item['username'] != username:
                logging.error(
                    f"User {username} is not the owner of item {item_id}")
                return jsonify({'error': 'Unauthorized'}), 401

        item = request.json
        jsonschema.validate(instance=item, schema=schema)

        logging.info(
            f"Item successfully validated in {model_name}. Update: {item}")
        collection.replace_one({'_id': ObjectId(item_id)}, item)

        # Get whole item from database
        item = collection.find_one({'_id': ObjectId(item_id)})

        # remove _id field
        item.pop('_id', None)

        return jsonify({'status': 'success', 'data': item}), 200

    except jsonschema.ValidationError as e:
        logging.error(f"Validation Error in PUT /{model_name}: {str(e)}")
        return jsonify({'error': str(e)}), 400


@requires_auth
def delete(model_name, schema, collection, item_id, username):
    """
    Delete an item from the collection.

    :param model_name: The name of the model.
    :type model_name: str
    :param schema: The JSON schema, used to check if the item is owned by matching the username.
    :type schema: dict
    :param collection: The collection to delete from.
    :type collection: pymongo.collection.Collection
    :param item_id: The ID of the item to delete.
    :type item_id: str
    :param username: The username of the authorized user.
    :type username: str
    :returns: A JSON response containing the status of the deletion.
    :rtype: flask.Response
    :raises jsonschema.ValidationError: If there is a validation error.
    """

    logging.info(f"delete: {request.method} {request.path}")
    try:
        # If item.owner exists, check if authorized user is owner
        if 'owner' in schema['properties']:
            item = collection.find_one({'_id': ObjectId(item_id)})
            if item['owner'] != username:
                logging.error(
                    f"User {username} is not the owner of item {item_id}")
                return jsonify({'error': 'Unauthorized'}), 401

        # If model is user and username does not match, return unauthorized
        if model_name == 'user':
            item = collection.find_one({'_id': ObjectId(item_id)})
            if item['username'] != username:
                logging.error(
                    f"User {username} is not the owner of item {item_id}")
                return jsonify({'error': 'Unauthorized'}), 401

        result = collection.delete_one({'_id': ObjectId(item_id)})
        if result.deleted_count == 1:
            logging.info(f"Item successfully deleted from {model_name}")
            return jsonify({'status': 'success'}), 200
        else:
            logging.error(f"Item not found in DELETE /{model_name}")
            return jsonify({'error': 'Item not found'}), 404
    except Exception as e:
        logging.error(f"Error in DELETE /{model_name}: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500


app.add_url_rule('/auth', 'auth_endpoint',
                 auth_endpoint, methods=['POST'])


@app.route('/static_events', methods=['GET'])
def list_events():
    """
    Retrieve a list of static events from static_events.json.

    :returns: A JSON response containing the list of static events.
    :rtype: flask.Response
    """

    # Load static events from static_events.json
    logging.info(f"list_events: {request.method} {request.path}")
    static_events = []
    with open('static_events.json') as f:
        static_events = json.load(f)
        logging.info(f"Static events successfully retrieved")

        for event in static_events:
            event['id'] = f"{event['name'].replace(' ', '-').lower()}-{event['start'].replace(' ', '-').lower()}"
            # add location {latitude, longitude} if not present
            if 'location' not in event or 'latitude' not in event['location'] or 'longitude' not in event['location']:
                event['location'] = {
                    'latitude': 0,
                    'longitude': 0
                }

    return jsonify(static_events), 200


@app.route('/users_showing_location', methods=['GET'])
def users_showing_location():
    """
    Retrieves a list of users who have enabled location sharing and have valid latitude and longitude coordinates.

    :returns: A JSON response containing the list of users with their location information.
    :rtype: flask.Response
    """

    # Return fake users
    if False:
        return jsonify([
            {
                "username": "mikael",
                "name": "Mikael Green",
                "location": {
                    "latitude": 59.26961555623905,
                    "longitude": 15.206444871348385,
                    "timestamp": "2021-05-01T12:00:00Z"
                },
                "show_contact_info": True,
                "contact_info": "070-1234567"
            },
            {
                "username": "johan",
                "name": "Johan Green",
                "avatar_url": "data:image/jpeg;base64,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",
                "location": {
                    "latitude": 59.268891868767824,
                    "longitude": 15.205296885986005,
                    "timestamp": "2021-05-01T12:00:00Z"
                },
                "show_contact_info": True,
                "contact_info": "johan.green@yahoo.com"
            },
            {
                "username": "carl",
                "name": "Carl Green",
                "avatar_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbG-0Pc_dX0swJiOnUTf58QaSAwwUTpBUi6Q&usqp=CAU",
                "location": {
                    "latitude": 59.269007001894025,
                    "longitude": 15.206326854161597,
                    "timestamp": "2021-05-01T12:00:00Z"
                }
            },
            {
                "username": "julia",
                "name": "Julia Green",
                "avatar_url": "data:image/jpeg;base64,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",
                "location": {
                    "latitude": 59.27085456121105,
                    "longitude": 15.204953563260807,
                    "timestamp": "2021-05-01T12:00:00Z"
                },
                "show_contact_info": True,
                "contact_info": "julia@gmail.com"
            }
        ]), 200

    try:
        # Find users where show_location is true and location is not null and location.timestamp > 1 hour ago
        location_age_cutoff = datetime.datetime.now() - datetime.timedelta(hours=1)
        users = list(db.user.find({
            'show_location': True,
            'location': {'$ne': None},
            'location.latitude': {'$ne': None},
            'location.longitude': {'$ne': None},
            'location.timestamp': {'$gt': datetime.datetime.now() - datetime.timedelta(hours=1)}
        }))

        return jsonify(bson_to_json(users)), 200
    except Exception as e:
        logging.error(f"Error in GET /users_showing_location: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500


@app.route('/update_user_location', methods=['POST'])
def update_user_location():
    """
    Update the location of a user in the database.

    This function extracts the user ID and new location from the request body,
    checks if the user exists in the database, and updates the location if the user exists.
    If the user does not exist or the location is already up to date, appropriate error messages are returned.

    Returns:
    - A JSON response with a success message and status code 200 if the location is updated successfully.
    - A JSON response with an error message and status code 404 if the user is not found or the location is already up to date.
    - A JSON response with an error message and status code 500 if there is an internal server error.

    :returns: A JSON response containing the status of the location update.
    :rtype: flask.Response
    """

    try:
        # Extract the user ID and new location from the request body
        data = request.json
        username = data['username']
        new_location = data['location']
        new_location['timestamp'] = datetime.datetime.now()

        logging.info(
            f"Updating location for user {username} to {new_location} at {new_location['timestamp']}")

        existing_user = db.user.find_one(
            {"username": username})

        if existing_user:
            db.user.update_one(
                {"username": data["username"]},
                {'$set': {'location': new_location}}
            )
            logging.info(
                f"User with id {username} location updated to {new_location}")
            return jsonify({'message': 'User location updated successfully'}), 200
        else:
            # This means that no document was found with the provided `_id`
            logging.warning(
                f"No user found with id {username} for location update.")
            return jsonify({'error': 'User not found or location already up to date'}), 404

    except Exception as e:
        logging.error(f"Error in POST /update_user_location: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500


@app.errorhandler(404)
def page_not_found(e):
    """
    Handler for 404 Not Found errors.

    Logs all registered endpoints when a 404 error occurs.

    :param e: The error object.
    :type e: Exception
    :returns: A JSON response containing the error message and status code 404.
    :rtype: flask.Response
    """
    endpoints = []
    for rule in app.url_map.iter_rules():
        if isinstance(rule, Rule):
            endpoints.append(
                f'{rule.endpoint}: {list(rule.methods)} @ {rule.rule}')
    logging.info("Registered Endpoints:\n" + "\n".join(endpoints))

    return jsonify(error="404 Not Found"), 404


def initialize_dynamic_routes():
    """
    Initializes dynamic routes based on the JSON schema files in the schema directory.
    Each JSON file represents a model, and the routes are created accordingly.
    """

    logging.info(f"Schema files: {os.listdir(schema_dir)}")

    for filename in os.listdir(schema_dir):
        logging.info(f"Looking at {filename}")
        if filename.endswith('.json'):
            logging.info(f"{filename} is a json file")

            model_name = filename[:-5]
            logging.info(f"Model name: {model_name}")

            schema, collection = initialize_collection_from_schema(
                model_name,
                os.path.join(schema_dir, filename),
                db
            )

            logging.info(f"Initialized collection {model_name}")

            app.add_url_rule(f'/{model_name}', f'create_{model_name}',
                             partial(create, model_name, schema, collection), methods=['POST'])
            app.add_url_rule(f'/{model_name}', f'read_{model_name}',
                             partial(read, model_name, collection), methods=['GET'])
            app.add_url_rule(f'/{model_name}/<string:item_id>', f'read_{model_name}_by_id',
                             partial(read, model_name, collection), methods=['GET'])
            app.add_url_rule(f'/{model_name}/<string:item_id>', f'update_{model_name}',
                             partial(update, model_name, schema, collection), methods=['PUT'])
            app.add_url_rule(f'/{model_name}/<string:item_id>', f'delete_{model_name}',
                             partial(delete, model_name, schema, collection), methods=['DELETE'])


def initialize_app():
    """
    Initializes the application by setting up the MongoDB client, ensuring the existence of the appstore review user,
    and initializing dynamic routes.
    """

    if 'sphinx' in sys.modules:
        return

    global db

    # Initialize MongoDB client
    client = MongoClient('mongo', 27017)
    db = client['swag']

    # Ensure appstore review user exists

    # Check if /review_user.txt exists
    if os.path.exists('/review_user.txt'):
        with open('/review_user.txt', 'r') as f:
            review_user = f.read()
            result = db['user'].update_one({'username': review_user}, {
                '$set': {
                    'name': 'Reviewer',
                    'avatar_url': 'https://swag.mikael.green/i-love-apple.png',
                }}, upsert=True)
            logging.info(f"Ensured review user exists: {result}")

    # Initialize dynamic routes
    initialize_dynamic_routes()


if __name__ == '__main__':
    app.config['ENV'] = 'development'
    initialize_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
