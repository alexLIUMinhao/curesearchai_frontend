from sqlalchemy.orm import Session

from app.models.note import Note
from app.repositories.note_repo import NoteRepository
from app.schemas.note import NoteCreate, NoteUpdate
from app.services.workflow_service import WorkflowService
from app.utils.exceptions import NotFoundException


class NoteService:
    def __init__(
        self,
        note_repo: NoteRepository | None = None,
        workflow_service: WorkflowService | None = None,
    ) -> None:
        self.note_repo = note_repo or NoteRepository()
        self.workflow_service = workflow_service or WorkflowService()

    def create_note(self, db: Session, payload: NoteCreate) -> Note:
        self.workflow_service.get_workflow(db, payload.workflow_id)
        note = Note(**payload.model_dump())
        return self.note_repo.create(db, note)

    def list_notes(self, db: Session, workflow_id: int | None = None) -> list[Note]:
        return self.note_repo.list(db, workflow_id=workflow_id)

    def update_note(self, db: Session, note_id: int, payload: NoteUpdate) -> Note:
        note = self.note_repo.get_by_id(db, note_id)
        if note is None:
            raise NotFoundException("note not found")
        values = payload.model_dump(exclude_unset=True)
        if not values:
            return note
        return self.note_repo.update(db, note, values)

    def delete_note(self, db: Session, note_id: int) -> None:
        note = self.note_repo.get_by_id(db, note_id)
        if note is None:
            raise NotFoundException("note not found")
        self.note_repo.delete(db, note)

