from collections.abc import Sequence


def build_mock_research_snapshot(
    workflow_stage: str,
    structured_assets: Sequence[dict],
    background: str,
    resources: str,
    familiarity: str,
    existing_idea: str,
) -> dict[str, list[str] | str]:
    source_names = ", ".join(item["name"] for item in structured_assets[:3]) or "current structured sources"
    source_claims = [
        claim
        for item in structured_assets[:2]
        for claim in item.get("useful_claims", [])[:1]
    ]

    current_understanding = (
        f"The workflow is currently in the {workflow_stage} stage. The user has reviewed {source_names} "
        f"and is moving from source digestion into idea framing."
    )
    evidence_gathered = source_claims or [
        "At least one source has already been structured into reusable research claims.",
        "The current workflow already has enough evidence to define a first idea direction.",
    ]
    gaps = [
        f"Background context to anchor the idea: {background[:160] or 'not yet summarized'}.",
        f"Resource constraints still need translation into experiment scope: {resources[:160] or 'not yet summarized'}.",
        f"User familiarity and uncertainty should shape the first iteration: {familiarity[:160] or 'not yet summarized'}.",
    ]
    promising_directions = [
        "迁移型: move one mature method or baseline into a new domain, constraint, or task setup.",
        "改进型: improve one weak module, training choice, or evaluation strategy in the current baseline.",
        "挖坑型: turn an overlooked failure mode or evaluation gap into a concrete research question.",
    ]
    risks = [
        "The idea may still be too broad if it is not anchored to one target problem and one smallest next experiment.",
        f"Any existing intuition should be tested against the user's current idea sketch: {existing_idea[:160] or 'no initial idea captured yet'}.",
    ]
    return {
        "current_understanding": current_understanding,
        "evidence_gathered": evidence_gathered,
        "gaps": gaps,
        "promising_directions": promising_directions,
        "risks": risks,
    }
