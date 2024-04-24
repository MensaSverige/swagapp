from pydantic import BaseModel
from typing import List, Optional
from pydantic import BaseModel

class EventSiteNews(BaseModel):
    date: str
    time: str
    title: Optional[str] = None
    description: str
    by: str
