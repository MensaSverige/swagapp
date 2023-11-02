from flask import request, jsonify, current_app
import os
import jwt
from functools import wraps
from flask import request, jsonify
import logging
import datetime

logging.basicConfig(level=logging.INFO)

SECRET_KEY = os.getenv('SECRET_KEY')


def create_token(username, name, test=False):
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)  # 1 minute expiry
    payload = {
        'exp': exp,
        'iat': datetime.datetime.utcnow(),
        'sub': username,
        'name': name,
        'test': test
    }
    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm='HS256'
    )


def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return True, payload
    except jwt.ExpiredSignatureError:
        logging.error('Token expired at ' + str(payload['exp']))
        return False, 'Token expired'
    except jwt.InvalidTokenError as e:
        return False, str(e)


def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        logging.info(f"Request: {request.method} {request.path}")

        auth_header = request.headers.get('Authorization', None)
        if not auth_header:
            logging.error('Missing token')
            return jsonify({'error': 'Missing token'}), 401

        token = auth_header.split(' ')[1] if len(
            auth_header.split(' ')) > 1 else None
        if not token:
            logging.error('Token missing')
            return jsonify({'error': 'Token missing'}), 401

        logging.info(f"Token: {token}")

        valid, result = verify_token(token)
        if not valid:
            logging.error(result)
            return jsonify({'error': result}), 401

        return f(*args, **kwargs)
    return decorated
