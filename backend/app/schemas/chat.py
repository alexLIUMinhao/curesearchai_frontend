from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel
from app.schemas.llm_status import LLMRuntimeStatusRead


ChatRole = Literal["user", "assistant", "system"]
ChatModeHint = Literal["auto", "qa", "idea_builder"]


class ChatMessageCreate(BaseModel):
    workflow_id: int
    role: ChatRole
    content: str


class ChatMessageRead(ORMModel):
    id: int
    workflow_id: int
    role: str
    content: str
    created_at: datetime


class ChatSendRequest(BaseModel):
    workflow_id: int
    message: str = Field(..., min_length=1)
    use_mock: bool | None = None
    mode_hint: ChatModeHint | None = "auto"


class TaskSuggestion(BaseModel):
    title: str
    description: str | None = None


class ContextSourceRead(BaseModel):
    asset_id: int
    name: str


class TaskDraftRead(BaseModel):
    title: str
    description: str = ""
    related_claim: str = ""
    owner: str = ""
    priority: str = "medium"
    status: str = "todo"


class ChatSendResponse(BaseModel):
    user_message: ChatMessageRead
    assistant_message: ChatMessageRead
    optional_tasks: list[TaskSuggestion] = []
    route: str = "qa"
    intent: str = "general_chat"
    context_sources: list[ContextSourceRead] = []
    task_drafts: list[TaskDraftRead] = []
    llm_status: LLMRuntimeStatusRead
