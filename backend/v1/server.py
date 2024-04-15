import datetime
import logging
import os
from pydantic.v1.json import ENCODERS_BY_TYPE
from bson import ObjectId
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import datetime
import logging
from api.auth import auth_v1
from api.health import health_v1
from api.users import users_v1
from api.events import events_v1
from user_events.user_events_api import user_events_v1
from db.mongo import initialize_db

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

app.include_router(auth_v1)
app.include_router(health_v1)
app.include_router(users_v1)
app.include_router(events_v1)
app.include_router(user_events_v1)

if os.getenv("ENABLE_DEV_ENDPOINTS") == "true":
    from dev.user_events import dev_user_events
    app.include_router(dev_user_events)


def initialize_app():
    initialize_db()


if __name__ == "__main__":
    import uvicorn
    initialize_app()
    uvicorn.run(app, host="0.0.0.0", port=5000)
