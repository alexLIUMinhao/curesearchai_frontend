from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.chat import ChatMessageRead
from app.schemas.common import ApiEnvelope
from app.schemas.idea_builder import (
    IdeaBuilderRunResponse,
    IdeaBuilderStartRequest,
    IdeaBuilderStateRead,
    IdeaBuilderRespondRequest,
    IdeaTaskDraftRead,
)
from app.schemas.note import NoteRead
from app.services.idea_builder_service import IdeaBuilderService
from app.utils.response import success_response


router = APIRouter(prefix="/idea-builder", tags=["idea-builder"])
idea_builder_service = IdeaBuilderService()


def _build_run_response(payload: dict) -> IdeaBuilderRunResponse:
    return IdeaBuilderRunResponse(
        workflow_id=payload["workflow_id"],
        phase=payload["phase"],
        state=IdeaBuilderStateRead.model_validate(payload["state"]),
        user_message=ChatMessageRead.model_validate(payload["user_message"]) if payload.get("user_message") else None,
        assistant_messages=[ChatMessageRead.model_validate(item) for item in payload.get("assistant_messages", [])],
        task_drafts=[IdeaTaskDraftRead.model_validate(item) for item in payload.get("task_drafts", [])],
        memory_note=NoteRead.model_validate(payload["memory_note"]) if payload.get("memory_note") else None,
    )


@router.post("/start", response_model=ApiEnvelope[IdeaBuilderRunResponse])
def start_idea_builder(payload: IdeaBuilderStartRequest, db: Session = Depends(get_db)):
    result = idea_builder_service.start(db, payload.workflow_id, payload.restart)
    return success_response(_build_run_response(result))


@router.post("/respond", response_model=ApiEnvelope[IdeaBuilderRunResponse])
def respond_idea_builder(payload: IdeaBuilderRespondRequest, db: Session = Depends(get_db)):
    result = idea_builder_service.respond(db, payload.workflow_id, payload.user_message, payload.direction_choice, payload.action)
    return success_response(_build_run_response(result))


@router.get("/state/{workflow_id}", response_model=ApiEnvelope[IdeaBuilderStateRead])
def get_idea_builder_state(workflow_id: int, db: Session = Depends(get_db)):
    result = idea_builder_service.get_state(db, workflow_id)
    return success_response(IdeaBuilderStateRead.model_validate(result))
