from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.common import ApiEnvelope, DeleteResponse
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate
from app.services.note_service import NoteService
from app.utils.response import success_response


router = APIRouter(prefix="/notes", tags=["notes"])
note_service = NoteService()


@router.post("", response_model=ApiEnvelope[NoteRead], status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)):
    note = note_service.create_note(db, payload)
    return success_response(NoteRead.model_validate(note))


@router.get("", response_model=ApiEnvelope[list[NoteRead]])
def list_notes(workflow_id: int | None = None, db: Session = Depends(get_db)):
    notes = note_service.list_notes(db, workflow_id=workflow_id)
    return success_response([NoteRead.model_validate(item) for item in notes])


@router.put("/{note_id}", response_model=ApiEnvelope[NoteRead])
def update_note(note_id: int, payload: NoteUpdate, db: Session = Depends(get_db)):
    note = note_service.update_note(db, note_id, payload)
    return success_response(NoteRead.model_validate(note))


@router.delete("/{note_id}", response_model=ApiEnvelope[DeleteResponse])
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note_service.delete_note(db, note_id)
    return success_response(DeleteResponse(success=True))

