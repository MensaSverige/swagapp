"""
This module provides functions for token processing in a Flask application.

It includes functions for generating and verifying JWT tokens, as well as decorators for
authentication and authorization.

Constants:
- access_token_expiry: Expiry time for access tokens.
- refresh_token_expiry: Expiry time for refresh tokens.
"""

import configparser
from flask import request, jsonify, current_app
import os
import jwt
from functools import wraps
from flask import request, jsonify
import logging
import datetime
from cryptography.fernet import Fernet


# access_token_expiry = datetime.timedelta(minutes=10)
# refresh_token_expiry = datetime.timedelta(hours=24)

access_token_expiry = datetime.timedelta(minutes=15)
refresh_token_expiry = datetime.timedelta(hours=24)


# Initialize logging
logging.basicConfig(level=logging.INFO)


def generate_secret_key():
    """
    Generates a secret key using the Fernet encryption algorithm.

    :return: The generated secret key.
    :rtype: str
    """
    return Fernet.generate_key().decode()


def get_or_create_jwt_secret():
    """
    Retrieves or creates a JWT secret key.

    If a secret key is already set in the application's configuration, it is returned.
    Otherwise, a secret key is generated and stored in a configuration file, and then returned.

    :return: The JWT secret key.
    :rtype: str
    """
    mocked_secret_key = current_app.config.get('SECRET_KEY', False)
    if mocked_secret_key:
        return mocked_secret_key

    secret_key_env_path = os.path.join(
        os.path.dirname(__file__), 'backend.ini')
    config = configparser.ConfigParser()

    # Check if backend.ini file exists, if not, create it
    if not os.path.exists(secret_key_env_path):
        config['DEFAULT'] = {'SECRET_KEY': generate_secret_key()}
        with open(secret_key_env_path, 'w') as configfile:
            config.write(configfile)
    else:
        config.read(secret_key_env_path)

    # Check if SECRET_KEY is set, if not, generate and set it
    if 'SECRET_KEY' not in config['DEFAULT']:
        config['DEFAULT']['SECRET_KEY'] = generate_secret_key()
        with open(secret_key_env_path, 'w') as configfile:
            config.write(configfile)

    # Return the SECRET_KEY
    return config['DEFAULT']['SECRET_KEY']


def create_token(username, expiry, type):
    """
    Create a JWT token with the given username, expiry, and type.

    :param username: The username associated with the token.
    :type username: str
    :param expiry: The expiration time for the token.
    :type expiry: datetime.timedelta
    :param type: The type of the token.
    :type type: str
    :return: The encoded JWT token.
    :rtype: str
    """
    exp = datetime.datetime.utcnow() + expiry
    payload = {
        'exp': exp,
        'iat': datetime.datetime.utcnow(),
        'sub': username,
        'type': type
    }
    return jwt.encode(payload, get_or_create_jwt_secret(), algorithm='HS256')


def create_refresh_token(username):
    """
    Create a refresh token for the given username.

    :param username: The username for which the refresh token is created.
    :type username: str
    :return: The refresh token.
    :rtype: str
    """

    return create_token(username, refresh_token_expiry, 'refresh')


def create_access_token(username):
    """
    Create an access token for the given username.

    :param username: The username for which the access token is created.
    :type username: str
    :return: The access token.
    :rtype: str
    """
    return create_token(username, access_token_expiry, 'access')


def verify_token(token, type):
    """
    Verify the authenticity and validity of a token.

    Used by :func:`verify_access_token` and :func:`verify_refresh_token`.

    :param token: The token to be verified.
    :type token: str
    :param type: The expected type of the token.
    :type type: str
    :return: A tuple containing a boolean indicating the verification result and the token payload.  
        - If the token is valid, the first element of the tuple is True and the second element is the token payload.
        - If the token is invalid, the first element of the tuple is False and the second element is the error message.
    """
    try:
        payload = jwt.decode(
            token, get_or_create_jwt_secret(), algorithms=['HS256'])
        if payload['type'] != type:
            raise jwt.InvalidTokenError('Invalid token type')
        return True, payload
    except jwt.ExpiredSignatureError:
        return False, 'Token expired'
    except jwt.InvalidTokenError as e:
        return False, str(e)


def verify_access_token(token):
    """
    Verify the access token.

    Uses :func:`verify_token`.

    :param token: The access token to be verified.
    :type token: str
    :return: A tuple containing a boolean indicating the verification result and the token payload.  
        - If the token is valid, the first element of the tuple is True and the second element is the token payload.
        - If the token is invalid, the first element of the tuple is False and the second element is the error message.
    """
    return verify_token(token, 'access')


def verify_refresh_token(token):
    """
    Verify the refresh token.

    Uses :func:`verify_token`.

    :param token: The refresh token to be verified.
    :type token: str
    :return: A tuple containing a boolean indicating the verification result and the token payload.  
        - If the token is valid, the first element of the tuple is True and the second element is the token payload.
        - If the token is invalid, the first element of the tuple is False and the second element is the error message.
    """
    return verify_token(token, 'refresh')


def requires_auth(f):
    """
    Decorator function that checks if the request has a valid authorization token.
    If the token is missing or invalid, it returns an error response.

    :param f: The function to be decorated.
    :type f: function
    :return: The decorated function.
    :rtype: function
    """
    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get('Authorization', None)
        if not auth_header:
            logging.error('Missing token')
            return jsonify({'error': 'Missing token'}), 401

        token = auth_header.split(' ')[1] if len(
            auth_header.split(' ')) > 1 else None
        if not token:
            logging.error('Token missing')
            return jsonify({'error': 'Token missing'}), 401

        valid, result = verify_access_token(token)
        if not valid:
            logging.error(result)
            return jsonify({'error': result}), 401

        kwargs['username'] = result['sub']

        return f(*args, **kwargs)
    return decorated
