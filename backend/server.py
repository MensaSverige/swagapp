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
    try:
        users = list(db.user.find({'show_location': True, 'location': {
                     '$ne': None}, 'location.latitude': {'$ne': None}, 'location.longitude': {'$ne': None}}))
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
