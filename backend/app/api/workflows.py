from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.common import ApiEnvelope, DeleteResponse
from app.schemas.workflow import WorkflowCreate, WorkflowRead, WorkflowUpdate
from app.services.workflow_service import WorkflowService
from app.utils.response import success_response


router = APIRouter(prefix="/workflows", tags=["workflows"])
workflow_service = WorkflowService()


@router.post("", response_model=ApiEnvelope[WorkflowRead], status_code=status.HTTP_201_CREATED)
def create_workflow(payload: WorkflowCreate, db: Session = Depends(get_db)):
    workflow = workflow_service.create_workflow(db, payload)
    return success_response(WorkflowRead.model_validate(workflow))


@router.get("", response_model=ApiEnvelope[list[WorkflowRead]])
def list_workflows(db: Session = Depends(get_db)):
    workflows = workflow_service.list_workflows(db)
    return success_response([WorkflowRead.model_validate(item) for item in workflows])


@router.get("/{workflow_id}", response_model=ApiEnvelope[WorkflowRead])
def get_workflow(workflow_id: int, db: Session = Depends(get_db)):
    workflow = workflow_service.get_workflow(db, workflow_id)
    return success_response(WorkflowRead.model_validate(workflow))


@router.put("/{workflow_id}", response_model=ApiEnvelope[WorkflowRead])
def update_workflow(workflow_id: int, payload: WorkflowUpdate, db: Session = Depends(get_db)):
    workflow = workflow_service.update_workflow(db, workflow_id, payload)
    return success_response(WorkflowRead.model_validate(workflow))


@router.delete("/{workflow_id}", response_model=ApiEnvelope[DeleteResponse])
def delete_workflow(workflow_id: int, db: Session = Depends(get_db)):
    workflow_service.delete_workflow(db, workflow_id)
    return success_response(DeleteResponse(success=True))

