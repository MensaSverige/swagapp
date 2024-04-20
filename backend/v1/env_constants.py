import os

try:
    LOGINM_SEED = os.getenv('LOGINM_SEED')
    LOGINB_SEED = os.getenv('LOGINB_SEED')
    EVENT_API_TOKEN = os.getenv('EVENT_API_TOKEN')
    URL_MEMBER_API = os.getenv('URL_MEMBER_API')
    URL_EVENTS_API = os.getenv('URL_EVENTS_API')
    SECRET_KEY = os.getenv('SECRET_KEY')
    TEST_MODE = os.getenv('TEST_MODE')

    if LOGINM_SEED is None or LOGINB_SEED is None or EVENT_API_TOKEN is None or URL_MEMBER_API is None or URL_EVENTS_API is None or SECRET_KEY is None or TEST_MODE is None:
        raise ValueError("One or more environment variables are not set")
except ValueError as e:
    print(f"Error: {e}")
