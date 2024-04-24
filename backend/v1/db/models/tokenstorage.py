from pydantic import BaseModel, Field
from datetime import datetime
from v1.utilities import get_current_time


class TokenStorage(BaseModel):
    userId: int = Field(..., example=123)
    externalAccessToken: str = Field(..., example="access_token_here")
    createdAt: datetime = Field(default_factory=get_current_time)
    expiresAt: datetime = Field(default_factory=get_current_time)
