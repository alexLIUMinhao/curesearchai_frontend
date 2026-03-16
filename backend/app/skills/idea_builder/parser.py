import json
from typing import Any


STATE_MARKER = "[Idea Builder State]"


def parse_state_block(content: str) -> dict[str, Any]:
    if not content.strip().startswith(STATE_MARKER):
        return {}
    payload = content.strip()[len(STATE_MARKER):].strip()
    if not payload:
        return {}
    return json.loads(payload)


def dump_state_block(state: dict[str, Any]) -> str:
    return f"{STATE_MARKER}\n{json.dumps(state, ensure_ascii=False, indent=2)}"
