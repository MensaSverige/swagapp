from flask import request, jsonify, current_app
import os
import jwt
from functools import wraps
from flask import request, jsonify
import logging
import datetime

logging.basicConfig(level=logging.INFO)

SECRET_KEY = os.getenv('SECRET_KEY')


def create_token(username, expiry, type):
    secret_key = current_app.config.get(
        'SECRET_KEY', SECRET_KEY)  # Use app config if available

    exp = datetime.datetime.utcnow() + expiry
    payload = {
        'exp': exp,
        'iat': datetime.datetime.utcnow(),
        'sub': username,
        'type': type
    }
    return jwt.encode(payload, secret_key, algorithm='HS256')


def create_refresh_token(username):
    return create_token(username, datetime.timedelta(hours=24), 'refresh')


def create_access_token(username):
    return create_token(username, datetime.timedelta(minutes=10), 'access')


def verify_token(token, type):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        if payload['type'] != type:
            raise jwt.InvalidTokenError('Invalid token type')
        return True, payload
    except jwt.ExpiredSignatureError:
        return False, 'Token expired'
    except jwt.InvalidTokenError as e:
        return False, str(e)


def verify_access_token(token):
    return verify_token(token, 'access')


def verify_refresh_token(token):
    return verify_token(token, 'refresh')


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

        valid, result = verify_access_token(token)
        if not valid:
            logging.error(result)
            return jsonify({'error': result}), 401

        kwargs['username'] = result['sub']

        return f(*args, **kwargs)
    return decorated
