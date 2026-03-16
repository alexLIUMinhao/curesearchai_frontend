from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

from app.schemas.chat import ChatMessageRead
from app.schemas.note import NoteRead


SkillName = Literal["asset_structurer"]


class RunAssetSkillRequest(BaseModel):
    asset_id: int
    skill_name: SkillName


class AssetStructurerResultRead(BaseModel):
    skill_name: str
    version: str
    status: str
    source_type: str
    summary: str
    research_problem: str
    method_overview: str
    key_contributions: list[str]
    datasets_or_materials: list[str]
    evaluation_or_results: list[str]
    limitations_or_risks: list[str]
    useful_claims: list[str]
    suggested_followups: list[str]
    keywords: list[str]
    structured_at: datetime | None = None
    llm_mode: str
    provider_label: str
    model: str | None = None
    error: str | None = None


class AssetSkillResultRead(BaseModel):
    asset_id: int
    skill_name: str
    status: str
    result: dict[str, Any]


class AssetSkillRunResponse(BaseModel):
    asset_id: int
    skill_name: str
    status: str
    result: dict[str, Any]
    assistant_message: ChatMessageRead | None = None
    memory_note: NoteRead | None = None
