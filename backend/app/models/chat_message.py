from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id"), index=True)
    role: Mapped[str] = mapped_column(String(50))
    content: Mapped[str] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

