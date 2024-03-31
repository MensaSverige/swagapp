import json
from flask import Blueprint, request, jsonify
import datetime
import hashlib
import requests
import logging

preshared_1 = 'ztc@xjwx5d!amw6png0DBPqmj*jtd0XHU9wkh8nwrmue1byz!jxc-cgjh-Vz9FKC'
url = 'https://medlem.mensa.se/mensa_verify/restlogin.php'

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth', methods=['POST'])
def authm():
    logging.info(f"request: {request.data}")
    data = request.get_json()
    client = 'swagapp'
    user = data['username']
    password = data['password']
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    loginm_hash = [user, password, timestamp, preshared_1]

    hash = calc_hash(loginm_hash)

    loginm_par = {
        'client': client,
        'user': user,
        'password': password,
        'timestamp': timestamp,
        'hash': hash,
        'prettyPrint': True
    }

    logging.info(f"loginm_par: {loginm_par}")
    ##forward the call to the loginm endpoint
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, json=loginm_par, headers=headers, verify=False)
    # Print the response
    logging.info(f"URL: {response.url}")
    logging.info(f"Status code: {response.status_code}")
    logging.info(f"Headers: {response.headers}")
    logging.info(f"Content: {response.content}")
    logging.info(f"Text: {response.text}")
    logging.info(f"JSON: {response.json() if response.content else None}")

    return response.json()
    #return null
    #return jsonify({"message": "Login failed"}), 401 


def calc_hash(strings):
    return hashlib.sha256('\n'.join(strings).encode()).hexdigest()

    
