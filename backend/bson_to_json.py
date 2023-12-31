from bson import json_util, ObjectId
import json


def bson_to_json(data):
    """
    Convert BSON data to JSON format, converting MongoDB-specific types to standard types.
    """
    def convert_item(item):
        """
        Convert special BSON types (like ObjectId and Date) to standard formats.
        """
        if isinstance(item, ObjectId):
            return str(item)
        elif isinstance(item, dict) and '$date' in item:
            # Convert BSON date to ISO 8601 string
            return item['$date']
        else:
            return item

    def transform(data):
        """
        Recursively traverse the data to convert special BSON types.
        """
        if isinstance(data, dict):
            new_data = {}
            for k, v in data.items():
                if k == '_id':  # Convert '_id' field
                    new_data['id'] = convert_item(v)
                else:
                    new_data[k] = transform(convert_item(v))
            return new_data
        elif isinstance(data, list):
            return [transform(convert_item(v)) for v in data]
        else:
            return convert_item(data)

    return transform(json.loads(json_util.dumps(data)))
