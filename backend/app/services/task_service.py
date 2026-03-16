from sqlalchemy.orm import Session

from app.models.task import Task
from app.repositories.task_repo import TaskRepository
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.workflow_service import WorkflowService
from app.utils.exceptions import NotFoundException


class TaskService:
    def __init__(
        self,
        task_repo: TaskRepository | None = None,
        workflow_service: WorkflowService | None = None,
    ) -> None:
        self.task_repo = task_repo or TaskRepository()
        self.workflow_service = workflow_service or WorkflowService()

    def create_task(self, db: Session, payload: TaskCreate) -> Task:
        self.workflow_service.get_workflow(db, payload.workflow_id)
        task = Task(**payload.model_dump())
        return self.task_repo.create(db, task)

    def list_tasks(self, db: Session, workflow_id: int | None = None) -> list[Task]:
        return self.task_repo.list(db, workflow_id=workflow_id)

    def update_task(self, db: Session, task_id: int, payload: TaskUpdate) -> Task:
        task = self.task_repo.get_by_id(db, task_id)
        if task is None:
            raise NotFoundException("task not found")
        values = payload.model_dump(exclude_unset=True)
        if not values:
            return task
        return self.task_repo.update(db, task, values)

    def delete_task(self, db: Session, task_id: int) -> None:
        task = self.task_repo.get_by_id(db, task_id)
        if task is None:
            raise NotFoundException("task not found")
        self.task_repo.delete(db, task)

