from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[str] = mapped_column(String(100), index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    stage: Mapped[str] = mapped_column(String(50), default="idea")
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

