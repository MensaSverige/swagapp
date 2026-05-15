from datetime import datetime
from typing import Optional
from pydantic import ConfigDict, BaseModel, Field

from v1.utilities import convert_to_tz_aware


class ModelWithId(BaseModel):
    id: Optional[str] = Field(alias="_id",
                              default=None,
                              serialization_alias='id')

    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: convert_to_tz_aware(v),
        },
        populate_by_name=True,
    )
