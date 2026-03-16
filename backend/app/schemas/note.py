from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


NoteType = Literal["insight", "summary", "draft", "issue"]


class NoteCreate(BaseModel):
    workflow_id: int
    title: str = Field(..., max_length=255)
    content: str
    note_type: NoteType = "insight"


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    content: str | None = None
    note_type: NoteType | None = None


class NoteRead(ORMModel):
    id: int
    workflow_id: int
    title: str
    content: str
    note_type: str
    created_at: datetime
    updated_at: datetime | None = None
