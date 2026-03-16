from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.chat_message import ChatMessage


class ChatRepository:
    def create_message(self, db: Session, message: ChatMessage) -> ChatMessage:
        db.add(message)
        db.commit()
        db.refresh(message)
        return message

    def list_by_workflow(self, db: Session, workflow_id: int, limit: int | None = None) -> list[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.workflow_id == workflow_id)
            .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
        )
        if limit is not None:
            stmt = stmt.limit(limit)
        records = list(db.scalars(stmt))
        return list(reversed(records))

