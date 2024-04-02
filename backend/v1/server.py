
import datetime
import logging
from pymongo import MongoClient
from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.responses import FileResponse
import datetime
import logging
from pymongo import MongoClient
from api.auth import auth_v1

from db.mongo import initialize_db

# Initialize logging
logging.basicConfig(level=logging.INFO)
logging.info(f"Server started at {datetime.datetime.now()}")


app = FastAPI()
app.include_router(auth_v1)


def initialize_app():
    initialize_db()

if __name__ == "__main__":
    import uvicorn
    initialize_app()
    uvicorn.run(app, host="0.0.0.0", port=5000)