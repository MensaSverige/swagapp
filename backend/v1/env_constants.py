import os

try:
    LOGINM_SEED = os.getenv('LOGINM_SEED')
    LOGINB_SEED = os.getenv('LOGINB_SEED')
    EVENT_API_TOKEN = os.getenv('EVENT_API_TOKEN')
    URL_MEMBER_API = os.getenv('URL_MEMBER_API')
    URL_EXTERNAL_ROOT = os.getenv('URL_EXTERNAL_ROOT')
    SECRET_KEY = os.getenv('SECRET_KEY')
    TEST_MODE = os.getenv('TEST_MODE')
    APPLE_REVIEW_USER = os.getenv('APPLE_REVIEW_USER')
    GOOGLE_REVIEW_USER = os.getenv('GOOGLE_REVIEW_USER')
    REVIEW_PASSWORD = os.getenv('REVIEW_PASSWORD')
    GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
    IPS_SSH_HOST = os.getenv('IPS_SSH_HOST')
    IPS_SSH_PORT = os.getenv('IPS_SSH_PORT', '22')
    IPS_SSH_USER = os.getenv('IPS_SSH_USER')
    IPS_SSH_PASSWORD = os.getenv('IPS_SSH_PASSWORD')
    IPS_SSH_KEY_PATH = os.getenv('IPS_SSH_KEY_PATH')
    IPS_DB_HOST = os.getenv('IPS_DB_HOST', 'localhost')
    IPS_DB_NAME = os.getenv('IPS_DB_NAME')
    IPS_DB_USER = os.getenv('IPS_DB_USER')
    IPS_DB_PASS = os.getenv('IPS_DB_PASS')

    if LOGINM_SEED is None or LOGINB_SEED is None or EVENT_API_TOKEN is None or URL_MEMBER_API is None or URL_EXTERNAL_ROOT is None or SECRET_KEY is None or TEST_MODE is None:
        raise ValueError("One or more environment variables are not set")
except ValueError as e:
    print(f"Error: {e}")
