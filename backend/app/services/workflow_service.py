from sqlalchemy.orm import Session

from app.models.workflow import Workflow
from app.repositories.workflow_repo import WorkflowRepository
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate
from app.utils.exceptions import NotFoundException


class WorkflowService:
    def __init__(self, workflow_repo: WorkflowRepository | None = None) -> None:
        self.workflow_repo = workflow_repo or WorkflowRepository()

    def create_workflow(self, db: Session, payload: WorkflowCreate) -> Workflow:
        workflow = Workflow(**payload.model_dump())
        return self.workflow_repo.create(db, workflow)

    def list_workflows(self, db: Session) -> list[Workflow]:
        return self.workflow_repo.list(db)

    def get_workflow(self, db: Session, workflow_id: int) -> Workflow:
        workflow = self.workflow_repo.get_by_id(db, workflow_id)
        if workflow is None:
            raise NotFoundException("workflow not found")
        return workflow

    def update_workflow(self, db: Session, workflow_id: int, payload: WorkflowUpdate) -> Workflow:
        workflow = self.get_workflow(db, workflow_id)
        values = payload.model_dump(exclude_unset=True)
        if not values:
            return workflow
        return self.workflow_repo.update(db, workflow, values)

    def delete_workflow(self, db: Session, workflow_id: int) -> None:
        workflow = self.get_workflow(db, workflow_id)
        self.workflow_repo.delete(db, workflow)

