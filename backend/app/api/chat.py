from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.chat import ChatMessageRead, ChatSendRequest, ChatSendResponse, ContextSourceRead, TaskDraftRead
from app.schemas.common import ApiEnvelope
from app.schemas.llm_status import LLMRuntimeStatusRead
from app.services.chat_orchestrator_service import ChatOrchestratorService
from app.services.chat_service import ChatService
from app.utils.response import success_response


router = APIRouter(prefix="/chat", tags=["chat"])
chat_service = ChatService()
chat_orchestrator = ChatOrchestratorService()


@router.post("/send", response_model=ApiEnvelope[ChatSendResponse], status_code=status.HTTP_201_CREATED)
def send_message(payload: ChatSendRequest, db: Session = Depends(get_db)):
    result = chat_orchestrator.send_message(
        db,
        payload.workflow_id,
        payload.message,
        payload.use_mock,
        payload.mode_hint or "auto",
    )
    response = ChatSendResponse(
        user_message=ChatMessageRead.model_validate(result["user_message"]),
        assistant_message=ChatMessageRead.model_validate(result["assistant_message"]),
        optional_tasks=result["optional_tasks"],
        route=result.get("route", "qa"),
        intent=result.get("intent", "general_chat"),
        context_sources=[ContextSourceRead.model_validate(item) for item in result.get("context_sources", [])],
        task_drafts=[TaskDraftRead.model_validate(item) for item in result.get("task_drafts", [])],
        llm_status=LLMRuntimeStatusRead.model_validate(result["llm_status"]),
    )
    return success_response(response)


@router.get("/history/{workflow_id}", response_model=ApiEnvelope[list[ChatMessageRead]])
def get_history(workflow_id: int, db: Session = Depends(get_db)):
    messages = chat_service.list_history(db, workflow_id)
    return success_response([ChatMessageRead.model_validate(item) for item in messages])
