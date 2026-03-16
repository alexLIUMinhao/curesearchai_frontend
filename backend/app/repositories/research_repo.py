from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.research_run import ResearchRun


class ResearchRunRepository:
    def create(self, db: Session, run: ResearchRun) -> ResearchRun:
        db.add(run)
        db.commit()
        db.refresh(run)
        return run

    def get_by_id(self, db: Session, run_id: int) -> ResearchRun | None:
        return db.get(ResearchRun, run_id)

    def list(self, db: Session, workflow_id: int | None = None) -> list[ResearchRun]:
        stmt = select(ResearchRun).order_by(ResearchRun.created_at.desc())
        if workflow_id is not None:
            stmt = stmt.where(ResearchRun.workflow_id == workflow_id)
        return list(db.scalars(stmt))

    def update(self, db: Session, run: ResearchRun, values: dict) -> ResearchRun:
        for key, value in values.items():
            setattr(run, key, value)
        db.commit()
        db.refresh(run)
        return run

