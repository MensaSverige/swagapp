
import datetime
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import datetime
import logging
from api.auth import auth_v1
from api.health import health_v1
from api.users import users_v1
from api.events import events_v1
from db.mongo import initialize_db

# Initialize logging
logging.basicConfig(level=logging.INFO)
logging.info(f"Server started at {datetime.datetime.now()}")


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


def initialize_app():
    initialize_db()

if __name__ == "__main__":
    import uvicorn
    initialize_app()
    uvicorn.run(app, host="0.0.0.0", port=5000)