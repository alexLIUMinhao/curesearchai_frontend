from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


WorkflowStage = Literal["idea", "reading", "experiment", "writing", "rebuttal"]
WorkflowStatus = Literal["active", "archived", "done"]


class WorkflowCreate(BaseModel):
    project_id: str = Field(..., max_length=100)
    name: str = Field(..., max_length=255)
    description: str | None = None
    stage: WorkflowStage = "idea"
    status: WorkflowStatus = "active"


class WorkflowUpdate(BaseModel):
    project_id: str | None = Field(default=None, max_length=100)
    name: str | None = Field(default=None, max_length=255)
    description: str | None = None
    stage: WorkflowStage | None = None
    status: WorkflowStatus | None = None


class WorkflowRead(ORMModel):
    id: int
    project_id: str
    name: str
    description: str | None = None
    stage: str
    status: str
    created_at: datetime
    updated_at: datetime | None = None

