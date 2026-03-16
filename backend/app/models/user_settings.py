from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120), default="Researcher")
    role_title: Mapped[str | None] = mapped_column(String(120), nullable=True)
    organization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    default_project_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    default_chat_mode: Mapped[str] = mapped_column(String(20), default="mock")
    llm_provider_label: Mapped[str] = mapped_column(String(50), default="openai")
    llm_provider_type: Mapped[str] = mapped_column(String(50), default="openai_compatible")
    llm_model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    llm_base_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    llm_api_key: Mapped[str | None] = mapped_column(Text(), nullable=True)
    llm_temperature: Mapped[float] = mapped_column(Float(), default=0.3)
    llm_timeout: Mapped[int] = mapped_column(Integer(), default=60)
    llm_use_mock_default: Mapped[bool] = mapped_column(Boolean(), default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
