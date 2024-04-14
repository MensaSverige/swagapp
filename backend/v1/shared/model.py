from pydantic_core import CoreSchema
from pydantic import GetJsonSchemaHandler, BaseModel, Field, ValidationInfo
from bson import ObjectId


class PyObjectId(ObjectId):

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, validation_info: ValidationInfo):
        if not ObjectId.is_valid(v):
            type_name = validation_info.config['title']
            raise ValueError(f'Invalid ObjectId in {type_name}: {v}')
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema: CoreSchema,
                                     handler: GetJsonSchemaHandler):
        schema = handler.resolve_ref_schema({'type': 'string'})
        return schema


class Model(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId)

    class Config:
        orm_mode = True
        json_encoders = {ObjectId: lambda oid: str(oid)}
