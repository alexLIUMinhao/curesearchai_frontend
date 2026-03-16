import logging
from typing import Literal

from sqlalchemy.orm import Session

from app.llm.runtime_status import get_runtime_status
from app.schemas.chat import TaskSuggestion
from app.services.chat_intent_service import ChatIntentService
from app.services.chat_memory_service import ChatMemoryService
from app.services.chat_service import ChatService
from app.services.context_assembler_service import ContextAssemblerService
from app.services.idea_builder_service import IdeaBuilderService
from app.utils.exceptions import AppException


logger = logging.getLogger(__name__)


ChatModeHint = Literal["auto", "qa", "idea_builder"]


class ChatOrchestratorService:
    def __init__(
        self,
        chat_service: ChatService | None = None,
        idea_builder_service: IdeaBuilderService | None = None,
        intent_service: ChatIntentService | None = None,
        context_assembler: ContextAssemblerService | None = None,
        memory_service: ChatMemoryService | None = None,
    ) -> None:
        self.chat_service = chat_service or ChatService()
        self.idea_builder_service = idea_builder_service or IdeaBuilderService()
        self.intent_service = intent_service or ChatIntentService()
        self.context_assembler = context_assembler or ContextAssemblerService()
        self.memory_service = memory_service or ChatMemoryService()

    def send_message(
        self,
        db: Session,
        workflow_id: int,
        user_message: str,
        use_mock: bool | None = None,
        mode_hint: ChatModeHint = "auto",
    ) -> dict:
        idea_state = self.idea_builder_service.get_state(db, workflow_id)
        idea_active = idea_state["phase"] not in {"idle", "completed"}
        decision = self.intent_service.classify(
            user_message,
            idea_builder_active=idea_active,
            mode_hint=mode_hint,
            idea_builder_phase=idea_state["phase"],
        )

        if decision.route == "idea_builder":
            if not idea_active and mode_hint == "idea_builder":
                raise AppException("Idea Builder is not active. Structure sources or restart Idea Builder first.", code=400)
            if not idea_active:
                decision = self.intent_service.classify(user_message, idea_builder_active=False, mode_hint="qa")
            else:
                result = self._send_to_idea_builder(
                    db=db,
                    workflow_id=workflow_id,
                    message=user_message,
                    intent=decision.intent,
                    direction_choice=decision.direction_choice,
                    action=decision.action,
                )
                self._upsert_memory_safe(db, workflow_id, user_message)
                return result

        context_pack = self.context_assembler.build_context_pack(db, workflow_id, user_message, top_k=3)
        context_sources = [{"asset_id": item.asset_id, "name": item.name} for item in context_pack["sources"]]
        qa_result = self.chat_service.send_message(
            db,
            workflow_id=workflow_id,
            user_message_text=user_message,
            use_mock=use_mock,
            intent=decision.intent,
            context_pack=context_pack,
            context_sources=context_sources,
        )
        self._upsert_memory_safe(db, workflow_id, user_message)
        return qa_result

    def _send_to_idea_builder(
        self,
        db: Session,
        workflow_id: int,
        message: str,
        intent: str,
        direction_choice: str | None,
        action: str | None,
    ) -> dict:
        user_payload: str | None = None
        if intent == "idea_builder_progress":
            user_payload = message

        try:
            result = self.idea_builder_service.respond(
                db,
                workflow_id=workflow_id,
                user_message=user_payload,
                direction_choice=direction_choice,
                action=action,
            )
        except AppException as exc:
            # If a direction/action arrives before the state reaches that phase, degrade to a normal progress answer.
            if intent in {"idea_direction_select", "idea_task_action"}:
                result = self.idea_builder_service.respond(
                    db,
                    workflow_id=workflow_id,
                    user_message=message,
                    direction_choice=None,
                    action=None,
                )
                intent = "idea_builder_progress"
            else:
                raise exc
        assistant_messages = result.get("assistant_messages") or []
        if not assistant_messages:
            raise AppException("Idea Builder did not produce an assistant response.", code=500)

        task_drafts = result.get("task_drafts") or []
        optional_tasks = [
            TaskSuggestion(title=item["title"], description=item.get("description") or None)
            for item in task_drafts
        ]
        if result.get("user_message") is None:
            raise AppException("Idea Builder did not record the user message.", code=500)
        return {
            "user_message": result.get("user_message"),
            "assistant_message": assistant_messages[-1],
            "optional_tasks": optional_tasks,
            "route": "idea_builder",
            "intent": intent,
            "context_sources": [],
            "task_drafts": task_drafts,
            "llm_status": get_runtime_status(),
        }

    def _upsert_memory_safe(self, db: Session, workflow_id: int, message: str) -> None:
        try:
            self.memory_service.upsert_memory(db, workflow_id, message)
        except Exception as exc:
            logger.warning("conversation memory update skipped: workflow_id=%s error=%s", workflow_id, exc)
