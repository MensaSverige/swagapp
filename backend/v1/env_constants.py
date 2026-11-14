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
    GOOGLE_GEOCODING_API_KEY = os.getenv('GOOGLE_GEOCODING_API_KEY')
    # Reaching medlem.mensa.se's calendar database over an SSH tunnel. The
    # names match the secrets in swagapp's vault. MEDLEM_SSH_KEY is the key
    # ITSELF, not a path: a pod reads its credentials from the environment and
    # has no key file to point at. Docs: backend/v1/member_calendar/README.md
    MEDLEM_SSH_HOST = os.getenv('MEDLEM_HOST')
    MEDLEM_SSH_PORT = os.getenv('MEDLEM_PORT', '22')
    MEDLEM_SSH_USER = os.getenv('MEDLEM_USERNAME')
    MEDLEM_SSH_KEY = os.getenv('MEDLEM_SSH_KEY')
    MEDLEM_SSH_PASSWORD = os.getenv('MEDLEM_SSH_PASSWORD')
    MEDLEM_DB_HOST = os.getenv('MEDLEM_DB_HOST', 'localhost')
    MEDLEM_DB_NAME = os.getenv('MEDLEM_DB_NAME')
    MEDLEM_DB_USER = os.getenv('MEDLEM_DB_USER')
    MEDLEM_DB_PASS = os.getenv('MEDLEM_DB_PASS')

    MAIN_EVENT_GATING = os.getenv('MAIN_EVENT_GATING', 'false').lower() == 'true'

    if LOGINM_SEED is None or LOGINB_SEED is None or EVENT_API_TOKEN is None or URL_MEMBER_API is None or URL_EXTERNAL_ROOT is None or SECRET_KEY is None or TEST_MODE is None:
        raise ValueError("One or more environment variables are not set")
except ValueError as e:
    print(f"Error: {e}")
