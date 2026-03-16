from dataclasses import dataclass
from typing import Literal


ChatIntent = Literal[
    "qa_source_summary",
    "idea_builder_progress",
    "idea_direction_select",
    "idea_task_action",
    "general_chat",
]
ChatRoute = Literal["qa", "idea_builder"]
ModeHint = Literal["auto", "qa", "idea_builder"]


@dataclass
class IntentDecision:
    intent: ChatIntent
    route: ChatRoute
    direction_choice: str | None = None
    action: str | None = None


class ChatIntentService:
    def classify(
        self,
        message: str,
        idea_builder_active: bool,
        mode_hint: ModeHint = "auto",
        idea_builder_phase: str = "idle",
    ) -> IntentDecision:
        normalized = message.strip().lower()
        if mode_hint == "qa":
            return IntentDecision(intent="general_chat", route="qa")
        if mode_hint == "idea_builder":
            return self._classify_for_idea_builder(normalized)

        if idea_builder_active:
            if self._looks_like_source_qa(normalized):
                return IntentDecision(intent="qa_source_summary", route="qa")
            action = self._extract_task_action(normalized)
            if action is not None:
                return IntentDecision(intent="idea_task_action", route="idea_builder", action=action)
            direction_choice = self._extract_direction_choice(normalized)
            if direction_choice is not None:
                return IntentDecision(intent="idea_direction_select", route="idea_builder", direction_choice=direction_choice)
            if self._looks_like_general_qa(normalized):
                return IntentDecision(intent="general_chat", route="qa")
            if self._looks_like_phase_answer(normalized, idea_builder_phase):
                return IntentDecision(intent="idea_builder_progress", route="idea_builder")
            return IntentDecision(intent="general_chat", route="qa")
        if self._looks_like_source_qa(normalized):
            return IntentDecision(intent="qa_source_summary", route="qa")
        return IntentDecision(intent="general_chat", route="qa")

    def _classify_for_idea_builder(self, normalized_message: str) -> IntentDecision:
        direction_choice = self._extract_direction_choice(normalized_message)
        if direction_choice is not None:
            return IntentDecision(intent="idea_direction_select", route="idea_builder", direction_choice=direction_choice)
        action = self._extract_task_action(normalized_message)
        if action is not None:
            return IntentDecision(intent="idea_task_action", route="idea_builder", action=action)
        return IntentDecision(intent="idea_builder_progress", route="idea_builder")

    @staticmethod
    def _extract_direction_choice(message: str) -> str | None:
        if any(word in message for word in ["迁移型", "migration"]):
            return "migration"
        if any(word in message for word in ["改进型", "improvement", "improve"]):
            return "improvement"
        if any(word in message for word in ["挖坑型", "gap", "failure case", "blind spot"]):
            return "gap"
        return None

    @staticmethod
    def _extract_task_action(message: str) -> str | None:
        if any(word in message for word in ["生成任务", "generate tasks", "generate task"]):
            return "generate_tasks"
        if any(word in message for word in ["继续打磨", "keep refining", "refine"]):
            return "keep_refining"
        if "pause idea builder" in message or "暂停" in message:
            return "pause"
        return None

    @staticmethod
    def _looks_like_source_qa(message: str) -> bool:
        qa_keywords = [
            "这篇论文讲了什么",
            "总结这篇",
            "这份资料在说什么",
            "paper",
            "what is this paper about",
            "summary of this source",
            "what does this paper say",
            "论文在说什么",
        ]
        return any(keyword in message for keyword in qa_keywords)

    @staticmethod
    def _looks_like_general_qa(message: str) -> bool:
        question_mark = "?" in message or "？" in message
        qa_tokens = [
            "what",
            "why",
            "how",
            "which",
            "explain",
            "总结",
            "解释",
            "为什么",
            "怎么",
            "如何",
            "请问",
        ]
        return question_mark or any(token in message for token in qa_tokens)

    @staticmethod
    def _looks_like_phase_answer(message: str, phase: str) -> bool:
        phase_tokens: dict[str, list[str]] = {
            "background": ["背景", "研究", "theory", "experiment", "工程", "motivation", "i am", "我做"],
            "resources": ["资源", "dataset", "data", "code", "baseline", "gpu", "算力", "budget", "时间"],
            "familiarity": ["了解", "熟悉", "复现", "reproduce", "familiar", "know"],
            "existing_idea": ["想法", "假设", "idea", "hypothesis", "方向"],
            "refinement": ["目标", "实验", "假设", "next step", "计划", "ablation", "claim"],
        }
        tokens = phase_tokens.get(phase, [])
        if not tokens:
            return False
        return any(token in message for token in tokens)
