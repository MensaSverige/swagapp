# filepath: /Users/mix/Projects/swagapp/tools/test_api.py

import os
import json
import requests
from dotenv import load_dotenv

def main():
    # Load environment variables from .env in project root
    load_dotenv()

    API_BASE_URL = os.getenv("API_BASE_URL")
    USERNAME = os.getenv("USERNAME")
    PASSWORD = os.getenv("PASSWORD")

    if not all([API_BASE_URL, USERNAME, PASSWORD]):
        raise RuntimeError("Please set API_BASE_URL, USERNAME, and PASSWORD in your .env file")

    # Authenticate to get JWT token
    auth_url = f"{API_BASE_URL}/v1/authm"
    auth_resp = requests.post(
        auth_url,
        json={"username": USERNAME, "password": PASSWORD}
    )
    auth_resp.raise_for_status()
    auth_data = auth_resp.json()
    token = auth_data.get("accessToken")
    if not token:
        raise RuntimeError("Login did not return an accessToken")

    headers = {"Authorization": f"Bearer {token}"}

    # 1) Update settings: enable all location/email/phone and set phone number
    settings_payload = {
        "settings": {
            "show_location": "EVERYONE",
            "show_email": True,
            "show_phone": True
        },
        "contact_info": {"phone": "+1234567890"}
    }
    resp = requests.put(
        f"{API_BASE_URL}/v1/users/me",
        json=settings_payload,
        headers=headers
    )
    resp.raise_for_status()
    print("Settings enabled:", json.dumps(resp.json(), indent=4))

    # 2) Update settings: disable email and phone visibility
    settings_payload = {
        "settings": {
            "show_location": "NO_ONE",
            "show_email": False,
            "show_phone": False
        }
    }
    resp = requests.put(
        f"{API_BASE_URL}/v1/users/me",
        json=settings_payload,
        headers=headers
    )
    resp.raise_for_status()
    print("Settings disabled:", json.dumps(resp.json(), indent=4))

    # 3) Post a new location
    location_payload = {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "accuracy": 10,
      "timestamp": None,
    }
    resp = requests.put(
        f"{API_BASE_URL}/v1/users/me/location",
        json=location_payload,
        headers=headers
    )
    resp.raise_for_status()
    print("Location updated:", json.dumps(resp.json(), indent=4))

    # 4) List all users with location
    resp = requests.get(
        f"{API_BASE_URL}/v1/users",
        # params={"show_location": True},
        headers=headers
    )
    resp.raise_for_status()
    print("Users list:", json.dumps(resp.json(), indent=4))

if __name__ == "__main__":
    main()