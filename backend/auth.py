import logging
import os
import json
from flask import Flask, request, jsonify
import requests
from pymongo import MongoClient
from token_processing import create_token

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# Initialize MongoDB client
client = MongoClient('mongo', 27017)
db = client['swag']
users_collection = db['user']


def parse_html(html, start, end):
    start_idx = html.find(start) + len(start)
    end_idx = html.find(end, start_idx)
    return html[start_idx:end_idx]


@app.route('/auth', methods=['POST'])
def auth_endpoint():
    secret_key = os.environ.get("SECRET_KEY")
    test_mode = os.environ.get("TEST_MODE", "false")

    try:
        request_body = request.json
    except json.JSONDecodeError:
        return jsonify({"message": "Invalid request body"}), 400

    if request_body.get("test"):
        if test_mode != "true":
            return jsonify({"message": "Test mode is not enabled"}), 400
        hmac = create_token(
            secret_key, request_body["username"], "Test User", test=True)
        return jsonify({
            "username": request_body["username"],
            "name": "Test User",
            "token": hmac,
            "test": True
        }), 200

    user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
    session = requests.Session()

    # Fetch the start page to get CSRF token
    start_page_url = 'https://medlem.mensa.se/login/'
    start_page_response = session.get(start_page_url, headers={
        'User-Agent': user_agent
    })
    csrf_token = parse_html(start_page_response.text,
                            '<input type="hidden" name="csrfKey" value="', '"')

    # Perform login using POST request
    login_page_url = 'https://medlem.mensa.se/login/'
    login_form_data = {
        'login__standard_submitted': '1',
        'csrfKey': csrf_token,
        'auth': request_body["username"],
        'password': request_body["password"],
        'remember_me': '0',
        'remember_me_checkbox': '1'
    }

    login_response = session.post(login_page_url, data=login_form_data, headers={
        'User-Agent': user_agent,
        'Referer': start_page_url,
        'Origin': start_page_url
    })

    if login_response.status_code != 200:
        logging.info(
            f"Login failed with status code: {login_response.status_code}")
        return jsonify({"message": "Login failed"}), 401

    if 'Logga in' in login_response.text:
        logging.info("'Logga in' found in response")
        return jsonify({"message": "Login failed"}), 401

    # Fetch user's name from the response
    user_name_container = parse_html(
        login_response.text, 'id="elUserLink"', '</a>')

    user_name = parse_html(user_name_container, '>', '<').strip()

    hmac = create_token(
        secret_key, request_body["username"].lower(), user_name)

    # Fetch user's profile picture from the response
    profile_picture_container = parse_html(
        login_response.text, 'ipsUserPhoto', '</span')

    profile_picture_tag = parse_html(profile_picture_container, '<img', '>')
    profile_picture_tag = profile_picture_tag.replace("'", '"')
    profile_picture_url = parse_html(profile_picture_tag, 'src="', '"')

    # User details from login
    user_data = {
        "username": request_body["username"].lower(),
        "name": user_name,
        "avatar_url": profile_picture_url,
    }

    # Check if user exists
    existing_user = users_collection.find_one(
        {"username": user_data["username"]})

    if existing_user:
        # Update user
        logging.info(f"Updating user {user_data['username']}: {user_data}")
        users_collection.update_one(
            {"username": user_data["username"]},
            {"$set": {"name": user_data["name"],
                      "avatar_url": user_data["avatar_url"]}}
        )
    else:
        # Create new user
        logging.info(f"Creating user {user_data['username']}")
        users_collection.insert_one(user_data)

    # Get user object from database
    user = users_collection.find_one(
        {"username": user_data["username"]})

    # add string ID
    user["id"] = str(user["_id"])

    # Remove MongoDB _id field
    user.pop("_id")

    response = {
        "user": user,
        "token": hmac
    }

    return jsonify(response), 200
