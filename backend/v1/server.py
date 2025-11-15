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

from v1.jobs.scheduler import create_scheduler
from v1.google_maps_api.geolocation_api import geolocation_v1
from v1.api.auth import auth_v1
from v1.api.health import health_v1
from v1.api.users import users_v1
from v1.api.external_events import events_v1
from v1.events.events_api import unified_events_v1
from v1.external.event_site_news import get_event_site_news
from v1.external.event_api import get_external_root, get_external_event_details
from v1.db.external_events import clean_external_events, get_stored_external_event_details
from v1.user_events.user_events_api import user_events_v1
from v1.db.mongo import initialize_db
from v1.dev.exception_handlers import register_exception_handlers
from v1.utilities import get_current_time_formatted

# Initialize logging
logging.basicConfig(level=logging.INFO)
logging.info(f"Server started at {get_current_time_formatted()}")

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
app.include_router(unified_events_v1)
app.include_router(user_events_v1)
app.include_router(geolocation_v1)
app.mount("/static/img", StaticFiles(directory="/static/img"), name="static")

if os.getenv("ENABLE_DEV_ENDPOINTS") == "true":
    from v1.dev.user_events_dev_api import dev_user_events
    app.include_router(dev_user_events)


def initialize_app():
    initialize_db()

    scheduler = create_scheduler()
    scheduler.start()

initialize_app()  # uvicorn does not run the __main__ block below.

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
