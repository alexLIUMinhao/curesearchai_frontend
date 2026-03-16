from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.workflow import Workflow


class WorkflowRepository:
    def create(self, db: Session, workflow: Workflow) -> Workflow:
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        return workflow

    def get_by_id(self, db: Session, workflow_id: int) -> Workflow | None:
        return db.get(Workflow, workflow_id)

    def list(self, db: Session) -> list[Workflow]:
        return list(db.scalars(select(Workflow).order_by(Workflow.created_at.desc())))

    def update(self, db: Session, workflow: Workflow, values: dict) -> Workflow:
        for key, value in values.items():
            setattr(workflow, key, value)
        db.commit()
        db.refresh(workflow)
        return workflow

    def delete(self, db: Session, workflow: Workflow) -> None:
        db.delete(workflow)
        db.commit()

