import logging
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
schema_dir = './schema'


# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
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
    if model_name == 'event':
        logging.info("Skipping user events for review purposes.")
        return jsonify([]), 200

    logging.info(f"read: {request.method} {request.path}")
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
            logging.info(f"User {username} is trying to update user {item_id}")

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
    try:
        # get all users
        allusers = list(db.user.find())
        logging.info(f"all users: {allusers}")
        users = list(db.user.find({'show_location': True, 'latitude': {
                     '$ne': None}, 'longitude': {'$ne': None}}))
        logging.info(f"Users showing location: {users}")
        return jsonify(bson_to_json(users)), 200
    except Exception as e:
        logging.error(f"Error in GET /users_showing_location: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500


@app.route('/update_user_location', methods=['POST'])
def update_user_location():
    try:
        # Extract the user ID and new location from the request body
        data = request.json
        username = data['username']
        new_lat = data['latitude']
        new_lng = data['longitude']

        existing_user = db.user.find_one(
            {"username": username})

        if existing_user:
            db.user.update_one(
                {"username": data["username"]},
                {'$set': {'latitude': new_lat, 'longitude': new_lng}}
            )
            logging.info(
                f"User with id {username} location updated to latitude: {new_lat}, longitude: {new_lng}")
            return jsonify({'message': 'User location updated successfully'}), 200
        else:
            # This means that no document was found with the provided `_id`
            logging.warning(
                f"No user found with id {username} for location update.")
            return jsonify({'error': 'User not found or location already up to date'}), 404

    except Exception as e:
        logging.error(f"Error in POST /update_user_location: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500


# Debugging of dynamic API

def log_endpoints():
    '''Function to log all registered endpoints'''
    endpoints = []
    for rule in app.url_map.iter_rules():
        if isinstance(rule, Rule):
            endpoints.append(
                f'{rule.endpoint}: {list(rule.methods)} @ {rule.rule}')
    logging.info("Registered Endpoints:\n" + "\n".join(endpoints))


@app.errorhandler(404)
def page_not_found(e):
    '''Error handler for 404'''

    # Log all endpoints when a 404 occurs
    log_endpoints()
    return jsonify(error="404 Not Found"), 404


def initialize_dynamic_routes():
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
