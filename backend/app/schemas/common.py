from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict


T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ApiEnvelope(BaseModel, Generic[T]):
    code: int = 0
    message: str = "success"
    data: T


class DeleteResponse(BaseModel):
    success: bool


class TimestampMixin(ORMModel):
    created_at: datetime


class TimestampUpdateMixin(TimestampMixin):
    updated_at: datetime | None = None

