from flask import Blueprint, request, jsonify
from datetime import datetime
import hashlib
import pytz
import requests
import logging

preshared_1 = 'xxx'
preshared_2 = 'xxx'
url = 'https://medlem.mensa.se/mensa_verify/restlogin.php'
url2 = 'https://events.mensa.se/swag2024/info-rest/?sec_action=app-api'

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth', methods=['POST'])
def authm():
    logging.info(f"request: {request.data}")
    data = request.get_json()
    client = 'swagapp'
    user = data['username']
    password = data['password']
    timestamp = get_current_time()

    loginm_hash = [user, password, timestamp, preshared_1]

    hash = calc_hash(loginm_hash)

    loginm_par = {
        'client': client,
        'user': user,
        'password': password,
        'timestamp': timestamp,
        'hash': hash
    }

    logging.info(f"loginm_par: {loginm_par}")
    ##forward the call to the loginm endpoint
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, json=loginm_par, headers=headers, verify=False)
    # Print the response
    logging.info(f"Text: {response.text}")


    return response.json()
    #return null
    #return jsonify({"message": "Login failed"}), 401 

def authb():
    logging.info(f"request: {request.data}")
    data = request.get_json()
    client = 'swagapp'
    operation = 'loginb'
    user = data['username']
    password = data['password']
    timestamp = get_current_time()

    loginb_hash = [user, password, timestamp, preshared_2]

    hash = calc_hash(loginb_hash)

    loginb_par = {
        'client': client,
        'operation': operation,
        'user': user,
        'password': password,
        'timestamp': timestamp,
        'hash': hash
    }

    logging.info(f"loginb_par: {loginb_par}")
    ##forward the call to the loginm endpoint
    headers = {
        'Content-Type': 'application/json'}
    response = requests.post(url, json=loginb_par, headers=headers, verify=False)
    # Print the response
    logging.info(f"Text: {response.text}")


    return response.json()
    #return null
    #return jsonify({"message": "Login failed"}), 401 

def calc_hash(strings):
    combined_string = "\n".join(strings)
    return hashlib.sha256(combined_string.encode('utf-8')).hexdigest()
    
def get_current_time():
    swedish_tz = pytz.timezone('Europe/Stockholm')
    return datetime.now(swedish_tz).strftime('%Y-%m-%d %H:%M:%S')