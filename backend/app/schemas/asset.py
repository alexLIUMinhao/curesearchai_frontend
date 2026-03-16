from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


AssetType = Literal["pdf", "txt", "doc", "note", "data", "code", "result"]


class AssetCreate(BaseModel):
    workflow_id: int
    name: str = Field(..., max_length=255)
    type: AssetType
    file_path: str
    metadata_json: dict[str, Any] | None = None


class AssetRead(ORMModel):
    id: int
    workflow_id: int
    name: str
    type: str
    file_path: str
    metadata_json: dict[str, Any] | None = None
    created_at: datetime

