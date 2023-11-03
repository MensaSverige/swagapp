from Flask import jsonify
import json


def init_events(app, db):
    @app.route('/events', methods=['GET'])
    def list_events():
        # Load static events from static_events.json
        static_events = []
        with open('static_events.json') as f:
            static_events = json.load(f)

        # Load events from database
        db_events = list(db.events.find({}))

        return jsonify({
            'static': static_events,
            'user': db_events
        }), 200
