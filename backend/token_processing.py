from functools import wraps
from Crypto.Hash import HMAC, SHA256
from flask import request, jsonify
import base64
import json
import time


def verify_token(token, secret):
    try:
        payload_base64, signature_base64 = token.split('.')
        payload = base64.b64decode(payload_base64).decode('utf-8')
        signature = base64.b64decode(signature_base64)

        payload_json = json.loads(payload)

        if payload_json['exp'] < time.time():
            return False, 'Token expired'

        # Calculate HMAC
        hmac_obj = HMAC.new(secret.encode('utf-8'),
                            payload.encode('utf-8'), digestmod=SHA256)
        calculated_signature = hmac_obj.digest()

        if calculated_signature == signature:
            return True, payload_json
        else:
            return False, 'Invalid signature'
    except Exception as e:
        return False, str(e)


def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', None)
        if token is None:
            return jsonify({'error': 'Missing token'}), 401

        valid, result = verify_token(token, 'your_secret_key')
        if not valid:
            return jsonify({'error': result}), 401

        return f(*args, **kwargs)
    return decorated
