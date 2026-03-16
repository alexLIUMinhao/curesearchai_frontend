from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel
from app.schemas.llm_status import LLMRuntimeStatusRead


ChatMode = Literal["mock", "live"]
ProviderLabel = Literal["openai", "gemini", "qwen", "minimax", "kimi", "custom"]
ProviderType = Literal["openai_compatible", "gemini"]


class UserSettingsRead(ORMModel):
    id: int
    user_id: str
    display_name: str
    role_title: str | None = None
    organization: str | None = None
    default_project_id: str | None = None
    default_chat_mode: ChatMode
    llm_provider_label: ProviderLabel
    llm_provider_type: ProviderType
    llm_model: str | None = None
    llm_base_url: str | None = None
    llm_api_key_masked: str | None = None
    llm_temperature: float = 0.3
    llm_timeout: int = 60
    llm_use_mock_default: bool = True
    created_at: datetime
    updated_at: datetime | None = None


class UserSettingsUpdate(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=120)
    role_title: str | None = Field(default=None, max_length=120)
    organization: str | None = Field(default=None, max_length=255)
    default_project_id: str | None = Field(default=None, max_length=120)
    default_chat_mode: ChatMode = "mock"
    llm_provider_label: ProviderLabel = "openai"
    llm_provider_type: ProviderType = "openai_compatible"
    llm_model: str | None = Field(default=None, max_length=120)
    llm_base_url: str | None = Field(default=None, max_length=500)
    llm_api_key: str | None = None
    llm_temperature: float = Field(default=0.3, ge=0.0, le=2.0)
    llm_timeout: int = Field(default=60, ge=1, le=600)
    llm_use_mock_default: bool = True


class LLMProviderOptionRead(BaseModel):
    label: ProviderLabel
    name: str
    provider_type: ProviderType
    default_model: str
    default_base_url: str | None = None
    requires_base_url: bool = False
    supports_temperature: bool = True


class LLMTestRequest(BaseModel):
    llm_provider_label: ProviderLabel
    llm_provider_type: ProviderType
    llm_model: str = Field(..., min_length=1, max_length=120)
    llm_base_url: str | None = Field(default=None, max_length=500)
    llm_api_key: str | None = None
    llm_temperature: float = Field(default=0.3, ge=0.0, le=2.0)
    llm_timeout: int = Field(default=60, ge=1, le=600)


class LLMTestResponse(BaseModel):
    success: bool
    message: str
    provider_label: ProviderLabel
    provider_type: ProviderType
    model: str
    llm_status: LLMRuntimeStatusRead
