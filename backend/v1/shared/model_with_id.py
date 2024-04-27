from datetime import datetime
from typing import Annotated, Optional
from pydantic import BeforeValidator, ConfigDict, BaseModel, Field
from bson import ObjectId

from v1.utilities import convert_to_tz_aware

PyObjectId = Annotated[str, BeforeValidator(str)]


class ModelWithId(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id",
                                     default=None,
                                     example='507f191e810c19729de860ea',
                                     serialization_alias='id')

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={
            datetime: lambda v: convert_to_tz_aware(v),
            ObjectId: str,
        },
        populate_by_name=True,
    )
