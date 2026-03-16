from dataclasses import dataclass
from datetime import datetime

from app.models.asset import Asset


@dataclass
class SkillContext:
    asset: Asset
    extracted_text: str
    source_type: str


@dataclass
class SkillRunResult:
    skill_name: str
    status: str
    payload: dict
    assistant_content: str | None = None
    note_title: str | None = None
    note_content: str | None = None


@dataclass
class AssetStructurerPayload:
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
    structured_at: datetime
    llm_mode: str
    provider_label: str
    model: str | None
