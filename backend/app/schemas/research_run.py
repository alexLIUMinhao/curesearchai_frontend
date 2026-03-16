from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


ResearchRunStatus = Literal["pending", "running", "finished", "failed"]


class ResearchRunCreate(BaseModel):
    workflow_id: int
    title: str = Field(..., max_length=255)
    objective: str
    status: ResearchRunStatus = "pending"


class ResearchRunUpdate(BaseModel):
    status: ResearchRunStatus | None = None
    result_summary: str | None = None


class ResearchRunRead(ORMModel):
    id: int
    workflow_id: int
    title: str
    objective: str
    status: str
    result_summary: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

