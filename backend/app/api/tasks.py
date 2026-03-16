from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.common import ApiEnvelope, DeleteResponse
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services.task_service import TaskService
from app.utils.response import success_response


router = APIRouter(prefix="/tasks", tags=["tasks"])
task_service = TaskService()


@router.post("", response_model=ApiEnvelope[TaskRead], status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    task = task_service.create_task(db, payload)
    return success_response(TaskRead.model_validate(task))


@router.get("", response_model=ApiEnvelope[list[TaskRead]])
def list_tasks(workflow_id: int | None = None, db: Session = Depends(get_db)):
    tasks = task_service.list_tasks(db, workflow_id=workflow_id)
    return success_response([TaskRead.model_validate(item) for item in tasks])


@router.put("/{task_id}", response_model=ApiEnvelope[TaskRead])
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = task_service.update_task(db, task_id, payload)
    return success_response(TaskRead.model_validate(task))


@router.delete("/{task_id}", response_model=ApiEnvelope[DeleteResponse])
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task_service.delete_task(db, task_id)
    return success_response(DeleteResponse(success=True))

