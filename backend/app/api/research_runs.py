from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.common import ApiEnvelope
from app.schemas.research_run import ResearchRunCreate, ResearchRunRead
from app.services.research_service import ResearchService
from app.utils.response import success_response


router = APIRouter(prefix="/research-runs", tags=["research-runs"])
research_service = ResearchService()


@router.post("", response_model=ApiEnvelope[ResearchRunRead], status_code=status.HTTP_201_CREATED)
def create_research_run(payload: ResearchRunCreate, db: Session = Depends(get_db)):
    run = research_service.create_run(db, payload)
    return success_response(ResearchRunRead.model_validate(run))


@router.get("", response_model=ApiEnvelope[list[ResearchRunRead]])
def list_research_runs(workflow_id: int | None = None, db: Session = Depends(get_db)):
    runs = research_service.list_runs(db, workflow_id=workflow_id)
    return success_response([ResearchRunRead.model_validate(item) for item in runs])


@router.get("/{run_id}", response_model=ApiEnvelope[ResearchRunRead])
def get_research_run(run_id: int, db: Session = Depends(get_db)):
    run = research_service.get_run(db, run_id)
    return success_response(ResearchRunRead.model_validate(run))

