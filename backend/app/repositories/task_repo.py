from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task


class TaskRepository:
    def create(self, db: Session, task: Task) -> Task:
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    def get_by_id(self, db: Session, task_id: int) -> Task | None:
        return db.get(Task, task_id)

    def list(self, db: Session, workflow_id: int | None = None) -> list[Task]:
        stmt = select(Task).order_by(Task.created_at.desc())
        if workflow_id is not None:
            stmt = stmt.where(Task.workflow_id == workflow_id)
        return list(db.scalars(stmt))

    def update(self, db: Session, task: Task, values: dict) -> Task:
        for key, value in values.items():
            setattr(task, key, value)
        db.commit()
        db.refresh(task)
        return task

    def delete(self, db: Session, task: Task) -> None:
        db.delete(task)
        db.commit()

