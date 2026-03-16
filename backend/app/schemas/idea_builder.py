from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.chat import ChatMessageRead
from app.schemas.note import NoteRead
from app.schemas.task import TaskPriority, TaskStatus


IdeaBuilderPhase = Literal[
    "idle",
    "background",
    "resources",
    "familiarity",
    "existing_idea",
    "direction_choice",
    "refinement",
    "task_check",
    "completed",
]
IdeaDirectionChoice = Literal["migration", "improvement", "gap"]
IdeaBuilderAction = Literal["generate_tasks", "keep_refining", "pause"]


class IdeaTaskDraftRead(BaseModel):
    title: str
    description: str = ""
    related_claim: str = ""
    owner: str = ""
    priority: TaskPriority = "medium"
    status: TaskStatus = "todo"


class IdeaBuilderStateRead(BaseModel):
    workflow_id: int
    phase: IdeaBuilderPhase = "idle"
    maturity_score: float = 0.0
    direction_choice: IdeaDirectionChoice | None = None
    can_generate_tasks: bool = False
    memory_note_id: int | None = None
    task_generation_status: Literal["not_requested", "drafted", "generated"] = "not_requested"


class IdeaBuilderStartRequest(BaseModel):
    workflow_id: int
    restart: bool = False


class IdeaBuilderRespondRequest(BaseModel):
    workflow_id: int
    user_message: str | None = Field(default=None, min_length=1)
    direction_choice: IdeaDirectionChoice | None = None
    action: IdeaBuilderAction | None = None


class IdeaBuilderRunResponse(BaseModel):
    workflow_id: int
    phase: IdeaBuilderPhase
    state: IdeaBuilderStateRead
    user_message: ChatMessageRead | None = None
    assistant_messages: list[ChatMessageRead] = []
    task_drafts: list[IdeaTaskDraftRead] = []
    memory_note: NoteRead | None = None
