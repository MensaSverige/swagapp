from fastapi import FastAPI, APIRouter, Depends
from fastapi_health import health


health_v1 = APIRouter(prefix="/v1")

def get_session():
    return True

def is_database_online(session: bool = Depends(get_session)):
    return session

# might need some fixes here depending on needs https://pypi.org/project/fastapi-health/
@health_v1.get("/health")
def health(session: bool = Depends(is_database_online)):
    return {"status": "ok"}
