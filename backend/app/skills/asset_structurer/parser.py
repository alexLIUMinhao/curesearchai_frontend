import json
import re

from app.utils.exceptions import AppException


def parse_asset_structurer_output(text: str) -> dict:
    content = text.strip()
    try:
        return _normalize_payload(json.loads(content))
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", content, re.DOTALL)
    if match:
        try:
            return _normalize_payload(json.loads(match.group(1)))
        except json.JSONDecodeError as exc:
            raise AppException(f"asset_structurer returned invalid JSON: {exc}", code=400) from exc

    raise AppException("asset_structurer returned invalid JSON.", code=400)


def _normalize_payload(payload: dict) -> dict:
    list_fields = [
        "key_contributions",
        "datasets_or_materials",
        "evaluation_or_results",
        "limitations_or_risks",
        "useful_claims",
        "suggested_followups",
        "keywords",
    ]
    normalized = {
        "summary": str(payload.get("summary") or "").strip(),
        "research_problem": str(payload.get("research_problem") or "").strip(),
        "method_overview": str(payload.get("method_overview") or "").strip(),
    }
    for field in list_fields:
        value = payload.get(field) or []
        if not isinstance(value, list):
            value = [str(value)]
        normalized[field] = [str(item).strip() for item in value if str(item).strip()]
    return normalized
