import datetime
import logging
import os
from fastapi.staticfiles import StaticFiles
from pydantic.v1.json import ENCODERS_BY_TYPE
from bson import ObjectId
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import datetime
import logging
from v1.google_maps_api.geolocation_api import geolocation_v1
from v1.api.auth import auth_v1
from v1.api.health import health_v1
from v1.api.users import users_v1
from v1.api.events import events_v1
from v1.external.event_site_news import get_event_site_news
from v1.external.event_api import get_external_root, get_external_event_details
from v1.db.external_events import clean_external_events, get_stored_external_event_details
from v1.user_events.user_events_api import user_events_v1
from v1.db.mongo import initialize_db
from v1.dev.exception_handlers import register_exception_handlers

# Initialize logging
logging.basicConfig(level=logging.INFO)
logging.info(f"Server started at {datetime.datetime.now()}")

# Configure pydantic to automatically convert MongoDB ObjectId to string so we
# don't have to manually create ID indices with autoincrementing integers
ENCODERS_BY_TYPE[ObjectId] = str

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth_v1)
app.include_router(health_v1)
app.include_router(users_v1)
app.include_router(events_v1)
app.include_router(user_events_v1)
app.include_router(geolocation_v1)
app.mount("/static/img", StaticFiles(directory="/static/img"), name="static")

if os.getenv("ENABLE_DEV_ENDPOINTS") == "true":
    from v1.dev.user_events_dev_api import dev_user_events
    app.include_router(dev_user_events)


def initialize_app():
    initialize_db()
    root = get_external_root()
    if not root or not root.restUrl or root.restUrl == "" or not root.dates:
        logging.error("Failed to fetch external root or missing data.")
        return

    all_external_events = []
    for date in root.dates:
        date_external_events = get_external_event_details(root.restUrl, date)
        all_external_events.extend(date_external_events)
    
    # Remove external events that are not in the list of all_external_events
    clean_external_events(keeping=all_external_events)

    # Triple checking. Check that each of all_external_events is still in the database,
    # using get_stored_external_event_details
    for event in all_external_events:
        event_id = event.eventId
        # Check if the event is in the database
        stored_event = get_stored_external_event_details(event_ids=[event_id])
        if not stored_event:
            logging.error(f"Event {event_id} not found in the database after cleaning.")
            continue

    get_event_site_news(root.restUrl)

initialize_app()  # uvicorn does not run the __main__ block below.

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
