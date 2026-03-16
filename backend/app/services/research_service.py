from sqlalchemy.orm import Session

from app.models.research_run import ResearchRun
from app.repositories.research_repo import ResearchRunRepository
from app.schemas.research_run import ResearchRunCreate, ResearchRunUpdate
from app.services.workflow_service import WorkflowService
from app.utils.exceptions import NotFoundException


class ResearchService:
    def __init__(
        self,
        research_repo: ResearchRunRepository | None = None,
        workflow_service: WorkflowService | None = None,
    ) -> None:
        self.research_repo = research_repo or ResearchRunRepository()
        self.workflow_service = workflow_service or WorkflowService()

    def create_run(self, db: Session, payload: ResearchRunCreate) -> ResearchRun:
        self.workflow_service.get_workflow(db, payload.workflow_id)
        run = ResearchRun(**payload.model_dump())
        return self.research_repo.create(db, run)

    def list_runs(self, db: Session, workflow_id: int | None = None) -> list[ResearchRun]:
        return self.research_repo.list(db, workflow_id=workflow_id)

    def get_run(self, db: Session, run_id: int) -> ResearchRun:
        run = self.research_repo.get_by_id(db, run_id)
        if run is None:
            raise NotFoundException("research run not found")
        return run

    def update_run(self, db: Session, run_id: int, payload: ResearchRunUpdate) -> ResearchRun:
        run = self.get_run(db, run_id)
        values = payload.model_dump(exclude_unset=True)
        if not values:
            return run
        return self.research_repo.update(db, run, values)

