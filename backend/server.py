import logging
from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
from functools import partial
from token_processing import requires_auth
from auth import auth_endpoint
from mongo import initialize_collection_from_schema
from events import init_events
import jsonschema
import os

# Initialize logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

client = MongoClient('mongo', 27017)
db = client['swag']
schema_dir = './schema'


@requires_auth
def create(model_name, schema, collection):
    logging.info(f"create: {request.method} {request.path}")
    try:
        item = request.json
        jsonschema.validate(instance=item, schema=schema)
        collection.insert_one(item)
        logging.info(f"Item successfully created in {model_name}")
        return jsonify({'status': 'success'}), 201
    except jsonschema.ValidationError as e:
        logging.error(f"Validation Error in POST /{model_name}: {str(e)}")
        return jsonify({'error': str(e)}), 400


@requires_auth
def read(model_name, collection):
    logging.info(f"read: {request.method} {request.path}")
    try:
        filters = {}

        if request.args.get('show_location') == 'true':
            filters.show_location = True

        if filters:
            items = list(collection.find(filters))
        else:
            items = list(collection.find())

        logging.info(f"Items successfully retrieved from {model_name}")
        return jsonify(items), 200
    except Exception as e:
        logging.error(f"Error in GET /{model_name}: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500


@requires_auth
def update(model_name, schema, collection, item_id):
    logging.info(f"update: {request.method} {request.path}")
    try:
        logging.info("Trying to read item from request body")
        item = request.json
        logging.info(f"Item to update: {item}")
        jsonschema.validate(instance=item, schema=schema)

        # List all items in collection
        items = list(collection.find())
        logging.info(f"Items in {model_name}: {items}")

        result = collection.replace_one({'_id': ObjectId(item_id)}, item)
        logging.info(
            f"Item successfully updated in {model_name}: {result.modified_count}")

        # Get whole item from database
        item = collection.find_one({'_id': ObjectId(item_id)})
        logging.info(f"Item successfully retrieved from {model_name}: {item}")

        # remove _id field
        item.pop('_id', None)

        return jsonify({'status': 'success', 'data': item}), 200

    except jsonschema.ValidationError as e:
        logging.error(f"Validation Error in PUT /{model_name}: {str(e)}")
        return jsonify({'error': str(e)}), 400


@requires_auth
def delete(model_name, collection, item_id):
    logging.info(f"delete: {request.method} {request.path}")
    try:
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


for filename in os.listdir(schema_dir):
    if filename.endswith('.json'):
        model_name = filename[:-5]

        schema, collection = initialize_collection_from_schema(
            model_name,
            os.path.join(schema_dir, filename),
            db
        )

        app.add_url_rule(f'/{model_name}', f'create_{model_name}',
                         partial(create, model_name, schema, collection), methods=['POST'])
        app.add_url_rule(f'/{model_name}', f'read_{model_name}',
                         partial(read, model_name, collection), methods=['GET'])
        app.add_url_rule(f'/{model_name}/<string:item_id>', f'update_{model_name}',
                         partial(update, model_name, schema, collection), methods=['PUT'])
        app.add_url_rule(f'/{model_name}/<string:item_id>', f'delete_{model_name}',
                         partial(delete, model_name, collection), methods=['DELETE'])

app.add_url_rule('/auth', 'auth_endpoint',
                 auth_endpoint, methods=['POST'])

init_events(app, db)


@app.route('/users_showing_location', methods=['GET'])
def users_showing_location():
    try:
        users = list(db.users.find({'show_location': True}))
        return_users = []
        for user in users:
            return_users.append({
                'name': user['name'],
                'avatar_url': user['avatar_url'],
                'location': {
                    'lat': user['lat'],
                    'lng': user['lng']
                }
            })

        return jsonify(return_users), 200
    except Exception as e:
        logging.error(f"Error in GET /users_showing_location: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500


if __name__ == '__main__':
    app.config['ENV'] = 'development'
    app.run(host='0.0.0.0', port=5000, debug=True)
