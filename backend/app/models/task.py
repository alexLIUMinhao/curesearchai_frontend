from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    related_claim: Mapped[str | None] = mapped_column(Text(), nullable=True)
    owner: Mapped[str | None] = mapped_column(String(100), nullable=True)
    priority: Mapped[str] = mapped_column(String(50), default="medium")
    status: Mapped[str] = mapped_column(String(50), default="todo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

