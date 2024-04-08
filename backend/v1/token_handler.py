import configparser
import os
from pydantic import BaseModel, Field
from datetime import timedelta
from utilities import get_current_time
import jwt
from cryptography.fernet import Fernet

access_token_expiry_delta = timedelta(minutes=15)
refresh_token_expiry_delta = timedelta(hours=24)

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
    try:
        SECRET_KEY = os.getenv('SECRET_KEY')
        if SECRET_KEY is None:
            return generate_secret_key()
    except ValueError as e:
        print(f"Error: {e}")

def create_token(userId, expiry_delta, type):
    """
    Create a JWT token with the given userId, expiry, and type.

    :param userId: The userId associated with the token.
    :type userId: str
    :param expiry_delta: The expiration time for the token.
    :type expiry: datetime.timedelta
    :param type: The type of the token.
    :type type: str
    :return: The encoded JWT token.
    :rtype: str
    """
    exp = get_current_time() + expiry_delta
    payload = {
        'exp': exp,
        'iat': get_current_time(),
        'sub': userId,
        'type': type
    }
    return jwt.encode(payload, get_or_create_jwt_secret(), algorithm='HS256')

def create_refresh_token(userId):
    """
    Create a refresh token for the given userId.

    :param userId: The userId for which the refresh token is created.
    :type userId: str
    :return: The refresh token.
    :rtype: str
    """

    return create_token(userId, refresh_token_expiry_delta, 'refresh')

def create_access_token(userId):
    """
    Create an access token for the given userId.

    :param userId: The userId for which the access token is created.
    :type userId: str
    :return: The access token.
    :rtype: str
    """
    return create_token(userId, access_token_expiry_delta, 'access')

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