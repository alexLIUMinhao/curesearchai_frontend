import logging

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.llm.model_client import BaseModelClient, build_model_client, build_model_client_from_runtime_config
from app.llm.runtime_status import update_runtime_status
from app.llm.output_parser import parse_chat_output
from app.llm.prompt_builder import build_chat_prompt, build_chat_prompt_from_context
from app.models.chat_message import ChatMessage
from app.repositories.chat_repo import ChatRepository
from app.services.settings_service import SettingsService
from app.services.workflow_service import WorkflowService


logger = logging.getLogger(__name__)


class ChatService:
    def __init__(
        self,
        chat_repo: ChatRepository | None = None,
        workflow_service: WorkflowService | None = None,
        model_client: BaseModelClient | None = None,
        settings_service: SettingsService | None = None,
    ) -> None:
        self.chat_repo = chat_repo or ChatRepository()
        self.workflow_service = workflow_service or WorkflowService()
        self.model_client = model_client
        self.settings_service = settings_service or SettingsService()
        self.settings = get_settings()

    def send_message(
        self,
        db: Session,
        workflow_id: int,
        user_message_text: str,
        use_mock: bool | None = None,
        intent: str = "general_chat",
        context_pack: dict | None = None,
        context_sources: list[dict] | None = None,
    ) -> dict:
        workflow = self.workflow_service.get_workflow(db, workflow_id)
        user_message = self.chat_repo.create_message(
            db,
            ChatMessage(workflow_id=workflow_id, role="user", content=user_message_text),
        )
        history = self.chat_repo.list_by_workflow(db, workflow_id, limit=self.settings.chat_history_limit)
        if context_pack is not None:
            prompt = build_chat_prompt_from_context(context_pack, user_message_text, intent=intent)
        else:
            prompt = build_chat_prompt(workflow, history[:-1], user_message_text)
        invocation = self._call_model_with_retry(db, prompt, use_mock=use_mock)
        parsed_output = parse_chat_output(invocation.text)
        assistant_message = self.chat_repo.create_message(
            db,
            ChatMessage(workflow_id=workflow_id, role="assistant", content=parsed_output["reply_text"]),
        )
        return {
            "user_message": user_message,
            "assistant_message": assistant_message,
            "optional_tasks": parsed_output["optional_tasks"],
            "route": "qa",
            "intent": intent,
            "context_sources": context_sources or [],
            "task_drafts": [],
            "llm_status": update_runtime_status(
                connection_status="mock" if invocation.mode == "mock" else "connected",
                mode=invocation.mode,
                provider_label=invocation.provider_label,
                provider_type=invocation.provider_type,
                model=invocation.model,
                input_tokens=invocation.input_tokens,
                output_tokens=invocation.output_tokens,
                last_error=None,
            ),
        }

    def list_history(self, db: Session, workflow_id: int) -> list[ChatMessage]:
        self.workflow_service.get_workflow(db, workflow_id)
        return self.chat_repo.list_by_workflow(db, workflow_id)

    def _call_model_with_retry(self, db: Session, prompt: str, retries: int = 2, use_mock: bool | None = None):
        runtime_config = self.settings_service.build_runtime_config(db)
        model_client = self.model_client or build_model_client_from_runtime_config(runtime_config, force_mock=use_mock)
        for attempt in range(1, retries + 2):
            try:
                return model_client.generate(prompt)
            except Exception as exc:
                logger.warning("model invocation failed, attempt=%s error=%s", attempt, exc)
                if attempt > retries:
                    update_runtime_status(
                        connection_status="error",
                        mode="live" if use_mock is False else "mock",
                        provider_label=runtime_config.provider_label,
                        provider_type=runtime_config.provider_type,
                        model=runtime_config.model,
                        last_error=str(exc),
                    )
                    if use_mock is False:
                        logger.warning("Live model failed after retries, falling back to mock model")
                        return build_model_client(self.settings, force_mock=True).generate(prompt)
                    raise
        raise RuntimeError("model invocation failed unexpectedly")
