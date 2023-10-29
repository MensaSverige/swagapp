import logging
from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
from functools import partial
from token_processing import requires_auth
import jsonschema
import os
import json

# Initialize logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

client = MongoClient('mongo', 27017)
db = client['dynamic_crud']

schema_dir = './schema'


def create(model_name, schema, collection):
    @requires_auth
    def inner_func():
        try:
            item = request.json
            jsonschema.validate(instance=item, schema=schema)
            collection.insert_one(item)
            logging.info(f"Item successfully created in {model_name}")
            return jsonify({'status': 'success'}), 201
        except jsonschema.ValidationError as e:
            logging.error(f"Validation Error in POST /{model_name}: {str(e)}")
            return jsonify({'error': str(e)}), 400
    return inner_func


def read(model_name, collection):
    @requires_auth
    def inner_func():
        try:
            items = list(collection.find())
            logging.info(f"Items successfully retrieved from {model_name}")
            return jsonify(items), 200
        except Exception as e:
            logging.error(f"Error in GET /{model_name}: {str(e)}")
            return jsonify({'error': 'Internal Server Error'}), 500
    return inner_func


def update(model_name, schema, collection):
    @requires_auth
    def inner_func(item_id):
        try:
            item = request.json
            jsonschema.validate(instance=item, schema=schema)
            collection.replace_one({'_id': ObjectId(item_id)}, item)
            logging.info(f"Item successfully updated in {model_name}")
            return jsonify({'status': 'success'}), 200
        except jsonschema.ValidationError as e:
            logging.error(f"Validation Error in PUT /{model_name}: {str(e)}")
            return jsonify({'error': str(e)}), 400
    return inner_func


def delete(model_name, collection):
    @requires_auth
    def inner_func(item_id):
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
    return inner_func


for filename in os.listdir(schema_dir):
    if filename.endswith('.json'):
        model_name = filename[:-5]
        with open(os.path.join(schema_dir, filename)) as f:
            schema = json.load(f)

        collection = db[model_name]

        app.add_url_rule(f'/{model_name}', f'create_{model_name}',
                         partial(create, model_name, schema, collection), methods=['POST'])
        app.add_url_rule(f'/{model_name}', f'read_{model_name}',
                         partial(read, model_name, collection), methods=['GET'])
        app.add_url_rule(f'/{model_name}/<string:item_id>', f'update_{model_name}',
                         partial(update, model_name, schema, collection), methods=['PUT'])
        app.add_url_rule(f'/{model_name}/<string:item_id>', f'delete_{model_name}',
                         partial(delete, model_name, collection), methods=['DELETE'])

if __name__ == '__main__':
    app.config['ENV'] = 'development'
    app.run(host='0.0.0.0', port=5000, debug=True)
