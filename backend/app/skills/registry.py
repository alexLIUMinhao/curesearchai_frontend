from app.skills.asset_structurer.skill import AssetStructurerSkill
from app.utils.exceptions import NotFoundException


SKILL_REGISTRY = {
    "asset_structurer": AssetStructurerSkill(),
}


def get_skill(skill_name: str):
    skill = SKILL_REGISTRY.get(skill_name)
    if skill is None:
        raise NotFoundException("skill not found")
    return skill
