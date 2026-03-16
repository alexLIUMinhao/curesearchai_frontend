from app.skills.schemas import SkillContext


def build_asset_structurer_prompt(context: SkillContext) -> str:
    excerpt = context.extracted_text[:12000]
    return (
        "You are a research asset structuring assistant.\n"
        "Read the source excerpt and return valid JSON only.\n"
        "Use this schema:\n"
        "{\n"
        '  "summary": "string",\n'
        '  "research_problem": "string",\n'
        '  "method_overview": "string",\n'
        '  "key_contributions": ["string"],\n'
        '  "datasets_or_materials": ["string"],\n'
        '  "evaluation_or_results": ["string"],\n'
        '  "limitations_or_risks": ["string"],\n'
        '  "useful_claims": ["string"],\n'
        '  "suggested_followups": ["string"],\n'
        '  "keywords": ["string"]\n'
        "}\n"
        "Do not include markdown fences or commentary.\n"
        f"Source type: {context.source_type}\n"
        f"Asset name: {context.asset.name}\n"
        "Source excerpt:\n"
        f"{excerpt}"
    )
