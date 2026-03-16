from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


TaskPriority = Literal["low", "medium", "high"]
TaskStatus = Literal["todo", "doing", "done"]


class TaskCreate(BaseModel):
    workflow_id: int
    title: str = Field(..., max_length=255)
    description: str | None = None
    related_claim: str | None = None
    owner: str | None = Field(default=None, max_length=100)
    priority: TaskPriority = "medium"
    status: TaskStatus = "todo"


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = None
    related_claim: str | None = None
    owner: str | None = Field(default=None, max_length=100)
    priority: TaskPriority | None = None
    status: TaskStatus | None = None


class TaskRead(ORMModel):
    id: int
    workflow_id: int
    title: str
    description: str | None = None
    related_claim: str | None = None
    owner: str | None = None
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime | None = None

