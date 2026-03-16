from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.note import Note


class NoteRepository:
    def create(self, db: Session, note: Note) -> Note:
        db.add(note)
        db.commit()
        db.refresh(note)
        return note

    def get_by_id(self, db: Session, note_id: int) -> Note | None:
        return db.get(Note, note_id)

    def list(self, db: Session, workflow_id: int | None = None) -> list[Note]:
        stmt = select(Note).order_by(Note.created_at.desc())
        if workflow_id is not None:
            stmt = stmt.where(Note.workflow_id == workflow_id)
        return list(db.scalars(stmt))

    def update(self, db: Session, note: Note, values: dict) -> Note:
        for key, value in values.items():
            setattr(note, key, value)
        db.commit()
        db.refresh(note)
        return note

    def delete(self, db: Session, note: Note) -> None:
        db.delete(note)
        db.commit()

