from bson import json_util
import json
import logging


def bson_to_json(data):
    """
    Convert BSON data to JSON format.

    :param data: The BSON data to be converted.
    :return: The JSON representation of the BSON data with the following modifications:
        - Recursively copies the '_id' field to 'id'
        - Converts ObjectID to string
    """
    json_data = json.loads(json_util.dumps(data))

    def copy_id_to_id(json_data):
        """
        Recursively copies the '_id' field to 'id' in the JSON data.

        :param json_data: The JSON data to be modified.
        :type json_data: dict
        :return: The modified JSON data.
        :rtype: dict
        """
        if isinstance(json_data, dict):
            if '_id' in json_data:
                if isinstance(json_data['_id'], dict) and '$oid' in json_data['_id']:
                    json_data['id'] = str(json_data['_id']['$oid'])
                else:
                    json_data['id'] = str(json_data['_id'])
                del json_data['_id']
            for key in json_data:
                copy_id_to_id(json_data[key])
        elif isinstance(json_data, list):
            for item in json_data:
                copy_id_to_id(item)

    copy_id_to_id(json_data)
    return json_data
