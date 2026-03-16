from dataclasses import asdict
from datetime import datetime, timezone

from app.core.config import get_settings
from app.llm.model_client import build_model_client_from_runtime_config
from app.services.settings_service import SettingsService
from app.skills.asset_structurer.parser import parse_asset_structurer_output
from app.skills.asset_structurer.prompt import build_asset_structurer_prompt
from app.skills.base import BaseSkill
from app.skills.schemas import AssetStructurerPayload, SkillContext, SkillRunResult


class AssetStructurerSkill(BaseSkill):
    skill_name = "asset_structurer"

    def __init__(self, settings_service: SettingsService | None = None) -> None:
        self.settings_service = settings_service or SettingsService()
        self.app_settings = get_settings()

    def run(self, context: SkillContext) -> SkillRunResult:
        raise RuntimeError("AssetStructurerSkill.run requires runtime config and cannot be used directly")

    def run_with_runtime(self, context: SkillContext, runtime_config) -> SkillRunResult:
        prompt = build_asset_structurer_prompt(context)
        client = build_model_client_from_runtime_config(runtime_config, force_mock=None)
        invocation = client.generate(prompt)
        parsed = _build_mock_payload(context) if invocation.mode == "mock" else parse_asset_structurer_output(invocation.text)
        payload = AssetStructurerPayload(
            skill_name=self.skill_name,
            version="v1",
            status="completed",
            source_type=context.source_type,
            summary=parsed["summary"],
            research_problem=parsed["research_problem"],
            method_overview=parsed["method_overview"],
            key_contributions=parsed["key_contributions"],
            datasets_or_materials=parsed["datasets_or_materials"],
            evaluation_or_results=parsed["evaluation_or_results"],
            limitations_or_risks=parsed["limitations_or_risks"],
            useful_claims=parsed["useful_claims"],
            suggested_followups=parsed["suggested_followups"],
            keywords=parsed["keywords"],
            structured_at=datetime.now(timezone.utc),
            llm_mode=invocation.mode,
            provider_label=invocation.provider_label,
            model=invocation.model,
        )
        payload_dict = asdict(payload)
        payload_dict["structured_at"] = payload.structured_at.isoformat()
        assistant_content = _build_assistant_content(context.asset.name, payload)
        note_title = f"Structured Source: {context.asset.name}"
        note_content = _build_note_content(context.asset.id, context.asset.name, payload)
        return SkillRunResult(
            skill_name=self.skill_name,
            status="completed",
            payload=payload_dict,
            assistant_content=assistant_content,
            note_title=note_title,
            note_content=note_content,
        )


def _build_mock_payload(context: SkillContext) -> dict:
    excerpt = context.extracted_text.strip().replace("\n", " ")
    short_excerpt = excerpt[:220] if excerpt else f"This {context.source_type} source supports an ongoing research workflow."
    return {
        "summary": f"Structured mock summary for {context.asset.name}: {short_excerpt}",
        "research_problem": "Clarify the source's main research question and how it reduces uncertainty in the workflow.",
        "method_overview": "Use this source as evidence, baseline context, and a scaffold for next-step reasoning.",
        "key_contributions": [
            "Condenses the source into a reusable workflow summary.",
            "Surfaces the main contribution and what to verify next.",
        ],
        "datasets_or_materials": ["Source excerpt"],
        "evaluation_or_results": ["The source appears relevant to the current workflow and merits structured review."],
        "limitations_or_risks": ["Mock mode uses heuristic structuring instead of a live model response."],
        "useful_claims": [
            "This source should be converted into a structured summary before further discussion.",
            "Key claims and follow-up actions should be persisted as workflow memory.",
        ],
        "suggested_followups": [
            "Compare this source against the current baseline or claim set.",
            "Turn the strongest claim from this source into a concrete workflow task.",
        ],
        "keywords": ["structured-summary", "source-review", context.source_type],
    }


def _build_assistant_content(asset_name: str, payload: AssetStructurerPayload) -> str:
    return (
        "[Structured Source Summary]\n"
        f"Source: {asset_name}\n\n"
        f"Summary:\n{payload.summary}\n\n"
        f"Research Problem:\n{payload.research_problem}\n\n"
        f"Method Overview:\n{payload.method_overview}\n\n"
        "Key Contributions:\n"
        + "\n".join(f"{index}. {item}" for index, item in enumerate(payload.key_contributions, start=1))
        + "\n\nUseful Claims:\n"
        + "\n".join(f"{index}. {item}" for index, item in enumerate(payload.useful_claims, start=1))
        + "\n\nSuggested Follow-ups:\n"
        + "\n".join(f"{index}. {item}" for index, item in enumerate(payload.suggested_followups, start=1))
    )


def _build_note_content(asset_id: int, asset_name: str, payload: AssetStructurerPayload) -> str:
    sections = [
        "Skill: asset_structurer",
        f"Asset ID: {asset_id}",
        f"Source: {asset_name}",
        "",
        "Summary:",
        payload.summary,
        "",
        "Research Problem:",
        payload.research_problem,
        "",
        "Method Overview:",
        payload.method_overview,
        "",
        "Key Contributions:",
        *[f"- {item}" for item in payload.key_contributions],
        "",
        "Useful Claims:",
        *[f"- {item}" for item in payload.useful_claims],
        "",
        "Suggested Follow-ups:",
        *[f"- {item}" for item in payload.suggested_followups],
    ]
    return "\n".join(sections).strip()
