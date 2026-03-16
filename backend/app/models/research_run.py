from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ResearchRun(Base):
    __tablename__ = "research_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    objective: Mapped[str] = mapped_column(Text())
    status: Mapped[str] = mapped_column(String(50), default="pending")
    result_summary: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

