from typing import Literal

from app.skills.idea_builder.mock_research import build_mock_research_snapshot
from app.skills.idea_builder.prompt import QUESTION_GROUPS, REFINEMENT_QUESTIONS


DirectionChoice = Literal["migration", "improvement", "gap"]


class IdeaBuilderSkill:
    skill_name = "idea_builder"

    def build_kickoff_message(self, source_names: list[str]) -> str:
        source_lines = "\n".join(f"- {name}" for name in source_names[:5]) or "- Structured source"
        questions = "\n".join(f"- {question}" for question in QUESTION_GROUPS["background"])
        return (
            "[Idea Builder Kickoff]\n"
            "Phase: Background\n\n"
            "Structured Sources:\n"
            f"{source_lines}\n\n"
            "Why this matters:\n"
            "We now have enough structured evidence to move from reading into idea framing.\n\n"
            "Questions:\n"
            f"{questions}"
        )

    def build_question_message(self, phase: str) -> str:
        questions = QUESTION_GROUPS[phase]
        title = phase.replace("_", " ").title()
        return (
            "[Idea Builder Kickoff]\n"
            f"Phase: {title}\n\n"
            "Questions:\n"
            + "\n".join(f"- {question}" for question in questions)
        )

    def build_deep_research_message(
        self,
        workflow_stage: str,
        structured_assets: list[dict],
        background: str,
        resources: str,
        familiarity: str,
        existing_idea: str,
    ) -> str:
        snapshot = build_mock_research_snapshot(
            workflow_stage=workflow_stage,
            structured_assets=structured_assets,
            background=background,
            resources=resources,
            familiarity=familiarity,
            existing_idea=existing_idea,
        )
        return (
            "[Deep Research Snapshot]\n"
            "Current understanding:\n"
            f"{snapshot['current_understanding']}\n\n"
            "Evidence gathered:\n"
            + "\n".join(f"- {item}" for item in snapshot["evidence_gathered"])
            + "\n\nGaps:\n"
            + "\n".join(f"- {item}" for item in snapshot["gaps"])
            + "\n\nPromising directions:\n"
            + "\n".join(f"- {item}" for item in snapshot["promising_directions"])
            + "\n\nRisks:\n"
            + "\n".join(f"- {item}" for item in snapshot["risks"])
        )

    def build_direction_options_message(self) -> str:
        return (
            "[Idea Direction Options]\n"
            "迁移型:\n"
            "把已有成熟方法迁移到新的场景、任务、数据或约束条件。\n\n"
            "改进型:\n"
            "在现有 baseline 或方法上做模块、训练或评估层面的增强。\n\n"
            "挖坑型:\n"
            "围绕 failure cases、evaluation gaps 或 data bias 定义新的研究空位。"
        )

    def build_refinement_message(self, direction_choice: DirectionChoice, turn: int) -> str:
        direction_map = {
            "migration": "迁移型",
            "improvement": "改进型",
            "gap": "挖坑型",
        }
        questions = REFINEMENT_QUESTIONS[direction_choice]
        return (
            "[Idea Builder Kickoff]\n"
            f"Phase: Refinement Round {turn}\n\n"
            f"Chosen direction:\n{direction_map[direction_choice]}\n\n"
            "Refinement focus:\n"
            + "\n".join(f"- {question}" for question in questions)
        )

    def build_task_generation_check_message(self, maturity_score: float) -> str:
        return (
            "[Task Generation Check]\n"
            f"Maturity score:\n{maturity_score:.1f}\n\n"
            "Recommendation:\n"
            "This idea is concrete enough to move into execution. Generate tasks now?"
        )

    def build_completion_message(self, direction_choice: DirectionChoice, task_count: int) -> str:
        direction_map = {
            "migration": "迁移型",
            "improvement": "改进型",
            "gap": "挖坑型",
        }
        return (
            "Idea Builder has converted the current direction into execution-ready drafts.\n"
            f"Direction: {direction_map[direction_choice]}\n"
            f"Prepared {task_count} task draft(s) for the right-side task panel."
        )

    def build_task_drafts(
        self,
        direction_choice: DirectionChoice,
        thesis: str,
        next_step: str,
    ) -> list[dict]:
        if direction_choice == "migration":
            return [
                {
                    "title": "Define the transfer setting and baseline gap",
                    "description": thesis or "Pin down the target domain, task constraint, and why the original baseline is insufficient.",
                    "related_claim": "A mature method can be transferred into the target setting with measurable gains.",
                    "owner": "",
                    "priority": "high",
                    "status": "todo",
                },
                {
                    "title": "Reproduce the source baseline on the new domain",
                    "description": "Rebuild the strongest source method in the chosen target setting and capture the first comparison.",
                    "related_claim": "Baseline reproduction is necessary before any transfer claim is credible.",
                    "owner": "",
                    "priority": "high",
                    "status": "todo",
                },
                {
                    "title": "Design the minimum adaptation experiment",
                    "description": next_step or "Specify the smallest adaptation experiment that can verify whether transfer is promising.",
                    "related_claim": "A constrained first experiment can reduce uncertainty quickly.",
                    "owner": "",
                    "priority": "medium",
                    "status": "todo",
                },
            ]
        if direction_choice == "improvement":
            return [
                {
                    "title": "Reproduce the baseline and isolate the weakest module",
                    "description": thesis or "Identify which component, training choice, or evaluation step is currently the main bottleneck.",
                    "related_claim": "Improvement work needs a clearly isolated weak link.",
                    "owner": "",
                    "priority": "high",
                    "status": "todo",
                },
                {
                    "title": "Propose one targeted modification",
                    "description": "Define a single modification and an evaluation criterion that would make the gain interpretable.",
                    "related_claim": "One scoped modification is easier to validate than a bundle of changes.",
                    "owner": "",
                    "priority": "medium",
                    "status": "todo",
                },
                {
                    "title": "Run an ablation plan for the modification",
                    "description": next_step or "Prepare the minimum ablation plan needed to verify whether the modification helps.",
                    "related_claim": "Ablation is required to defend the improvement claim.",
                    "owner": "",
                    "priority": "medium",
                    "status": "todo",
                },
            ]
        return [
            {
                "title": "Collect failure cases from current methods",
                "description": thesis or "Gather concrete cases where existing methods break or mislead evaluation.",
                "related_claim": "The research gap should be anchored in repeatable failure evidence.",
                "owner": "",
                "priority": "high",
                "status": "todo",
            },
            {
                "title": "Formalize the gap as a research claim",
                "description": "Turn the suspected evaluation or failure-case gap into a precise statement that can be tested.",
                "related_claim": "A vague gap is not actionable until it becomes a testable claim.",
                "owner": "",
                "priority": "high",
                "status": "todo",
            },
            {
                "title": "Design a minimum experiment to verify the gap",
                "description": next_step or "Specify the smallest experiment that can confirm whether the identified gap is real.",
                "related_claim": "A narrow first experiment can validate whether the gap is worth deeper work.",
                "owner": "",
                "priority": "medium",
                "status": "todo",
            },
        ]
