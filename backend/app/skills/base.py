from abc import ABC, abstractmethod

from app.skills.schemas import SkillContext, SkillRunResult


class BaseSkill(ABC):
    skill_name: str

    @abstractmethod
    def run(self, context: SkillContext) -> SkillRunResult:
        raise NotImplementedError
