# users.py

from flask import Blueprint, jsonify

users_bp = Blueprint('users', __name__)

@users_bp.route('/users_showing_location', methods=['GET'])
def users_showing_location():
    # Your existing code here...