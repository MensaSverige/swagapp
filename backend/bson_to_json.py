from bson import json_util
import json
import logging


def bson_to_json(data):
    # return json.loads(json_util.dumps(data))
    # Convert bson to json and also recursively copy _id to id, and convert ObjectID to string
    json_data = json.loads(json_util.dumps(data))

    # Recursively copy _id to id
    def copy_id_to_id(json_data):
        if isinstance(json_data, dict):
            if '_id' in json_data:
                # Check if _id is a dictionary and has the $oid key
                if isinstance(json_data['_id'], dict) and '$oid' in json_data['_id']:
                    json_data['id'] = str(json_data['_id']['$oid'])
                else:
                    # Handle case where _id is a simple string
                    json_data['id'] = str(json_data['_id'])
                del json_data['_id']
            for key in json_data:
                copy_id_to_id(json_data[key])
        elif isinstance(json_data, list):
            for item in json_data:
                copy_id_to_id(item)

    copy_id_to_id(json_data)
    return json_data
