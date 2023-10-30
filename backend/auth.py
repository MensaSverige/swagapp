import os
import json
import hashlib
import base64
import requests
from flask import request, jsonify


def parse_html(html, start, end):
    start_idx = html.find(start) + len(start)
    end_idx = html.find(end, start_idx)
    return html[start_idx:end_idx]


def create_hmac(secret, username, name, test=False):
    payload = json.dumps({
        "username": username,
        "name": name,
        "test": test,
        "exp": "60"  # Token expiry time
    }).encode('utf-8')

    hmac_obj = hashlib.new('sha256')
    hmac_obj.update(payload)
    hmac_obj.update(secret.encode('utf-8'))

    token = base64.b64encode(payload).decode(
        'utf-8') + '.' + hmac_obj.hexdigest()
    return token


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
        hmac = create_hmac(
            secret_key, request_body["username"], "Test User", test=True)
        return jsonify({
            "username": request_body["username"],
            "name": "Test User",
            "token": hmac,
            "test": True
        }), 200

    # Logic to handle actual authentication goes here
    # Omitted for brevity

    return jsonify({"message": "Auth completed"}), 200
