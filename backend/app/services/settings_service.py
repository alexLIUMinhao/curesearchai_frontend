from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.llm.model_client import ModelRuntimeConfig, build_model_client_from_runtime_config
from app.llm.runtime_status import get_runtime_status, update_runtime_status
from app.models.user_settings import UserSettings
from app.repositories.settings_repo import SettingsRepository
from app.schemas.llm_status import LLMRuntimeStatusRead
from app.schemas.settings import LLMProviderOptionRead, LLMTestRequest, LLMTestResponse, UserSettingsUpdate
from app.utils.exceptions import AppException


DEFAULT_USER_ID = "default-user"

PROVIDER_OPTIONS: list[LLMProviderOptionRead] = [
    LLMProviderOptionRead(
        label="openai",
        name="OpenAI",
        provider_type="openai_compatible",
        default_model="gpt-4o-mini",
        default_base_url="https://api.openai.com/v1",
        requires_base_url=True,
    ),
    LLMProviderOptionRead(
        label="gemini",
        name="Gemini",
        provider_type="gemini",
        default_model="gemini-2.0-flash",
    ),
    LLMProviderOptionRead(
        label="qwen",
        name="Qwen",
        provider_type="openai_compatible",
        default_model="qwen-plus",
        default_base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        requires_base_url=True,
    ),
    LLMProviderOptionRead(
        label="minimax",
        name="MiniMax",
        provider_type="openai_compatible",
        default_model="MiniMax-Text-01",
        default_base_url="https://api.minimax.chat/v1",
        requires_base_url=True,
    ),
    LLMProviderOptionRead(
        label="kimi",
        name="Kimi",
        provider_type="openai_compatible",
        default_model="moonshot-v1-8k",
        default_base_url="https://api.moonshot.cn/v1",
        requires_base_url=True,
    ),
    LLMProviderOptionRead(
        label="custom",
        name="Custom OpenAI-compatible",
        provider_type="openai_compatible",
        default_model="custom-model",
        default_base_url="https://your-endpoint.example/v1",
        requires_base_url=True,
    ),
]


def mask_api_key(api_key: str | None) -> str | None:
    if not api_key:
        return None
    if len(api_key) <= 8:
        return "*" * len(api_key)
    return f"{api_key[:4]}{'*' * max(4, len(api_key) - 8)}{api_key[-4:]}"


class SettingsService:
    def __init__(self, repo: SettingsRepository | None = None, app_settings: Settings | None = None) -> None:
        self.repo = repo or SettingsRepository()
        self.app_settings = app_settings or get_settings()

    def get_current_user_id(self) -> str:
        return DEFAULT_USER_ID

    def list_provider_options(self) -> list[LLMProviderOptionRead]:
        return PROVIDER_OPTIONS

    def get_or_create_settings(self, db: Session, user_id: str | None = None) -> UserSettings:
        resolved_user_id = user_id or self.get_current_user_id()
        existing = self.repo.get_by_user_id(db, resolved_user_id)
        if existing is not None:
            return existing
        default_payload = self._build_default_model_values()
        settings = UserSettings(
            user_id=resolved_user_id,
            display_name="Researcher",
            role_title="PI",
            organization="CUResearch.ai",
            default_project_id="default-project",
            default_chat_mode="mock" if default_payload.use_mock_default else "live",
            llm_provider_label=default_payload.provider_label,
            llm_provider_type=default_payload.provider_type,
            llm_model=default_payload.model,
            llm_base_url=default_payload.base_url,
            llm_api_key=default_payload.api_key,
            llm_temperature=default_payload.temperature,
            llm_timeout=default_payload.timeout,
            llm_use_mock_default=default_payload.use_mock_default,
        )
        return self.repo.create(db, settings)

    def update_settings(self, db: Session, payload: UserSettingsUpdate, user_id: str | None = None) -> UserSettings:
        settings = self.get_or_create_settings(db, user_id)
        values = payload.model_dump()
        if not values.get("llm_api_key"):
            values["llm_api_key"] = settings.llm_api_key
        if payload.default_chat_mode == "mock":
            values["llm_use_mock_default"] = True
        return self.repo.update(db, settings, values)

    def serialize_settings(self, settings: UserSettings) -> dict:
        return {
            "id": settings.id,
            "user_id": settings.user_id,
            "display_name": settings.display_name,
            "role_title": settings.role_title,
            "organization": settings.organization,
            "default_project_id": settings.default_project_id,
            "default_chat_mode": settings.default_chat_mode,
            "llm_provider_label": settings.llm_provider_label,
            "llm_provider_type": settings.llm_provider_type,
            "llm_model": settings.llm_model,
            "llm_base_url": settings.llm_base_url,
            "llm_api_key_masked": mask_api_key(settings.llm_api_key),
            "llm_temperature": settings.llm_temperature,
            "llm_timeout": settings.llm_timeout,
            "llm_use_mock_default": settings.llm_use_mock_default,
            "created_at": settings.created_at,
            "updated_at": settings.updated_at,
        }

    def build_runtime_config(self, db: Session, user_id: str | None = None) -> ModelRuntimeConfig:
        settings = self.get_or_create_settings(db, user_id)
        if settings.llm_model and settings.llm_provider_type:
            runtime_config = ModelRuntimeConfig(
                provider_label=settings.llm_provider_label,
                provider_type=settings.llm_provider_type,
                model=settings.llm_model,
                base_url=settings.llm_base_url,
                api_key=settings.llm_api_key,
                timeout=settings.llm_timeout,
                temperature=settings.llm_temperature,
                use_mock_default=settings.llm_use_mock_default or settings.default_chat_mode == "mock",
            )
            if self._runtime_config_is_complete(runtime_config):
                return runtime_config
        return self._build_default_model_values()

    def test_connection(self, payload: LLMTestRequest, db: Session | None = None, user_id: str | None = None) -> LLMTestResponse:
        existing_api_key = None
        if db is not None:
            existing_api_key = self.get_or_create_settings(db, user_id).llm_api_key
        runtime_config = ModelRuntimeConfig(
            provider_label=payload.llm_provider_label,
            provider_type=payload.llm_provider_type,
            model=payload.llm_model,
            base_url=payload.llm_base_url,
            api_key=payload.llm_api_key or existing_api_key,
            timeout=payload.llm_timeout,
            temperature=payload.llm_temperature,
            use_mock_default=False,
        )
        client = build_model_client_from_runtime_config(runtime_config, force_mock=None)
        if client.__class__.__name__ == "MockModelClient":
            raise AppException("Connection test fell back to mock. Check provider settings.", code=400)
        try:
            invocation = client.generate("Return one short sentence confirming the model connection.")
        except ValueError as exc:
            update_runtime_status(
                connection_status="error",
                mode="live",
                provider_label=runtime_config.provider_label,
                provider_type=runtime_config.provider_type,
                model=runtime_config.model,
                last_error=str(exc),
            )
            raise AppException(str(exc), code=400) from exc
        return LLMTestResponse(
            success=True,
            message="Connection succeeded.",
            provider_label=payload.llm_provider_label,
            provider_type=payload.llm_provider_type,
            model=payload.llm_model,
            llm_status=LLMRuntimeStatusRead.model_validate(
                update_runtime_status(
                    connection_status="connected",
                    mode=invocation.mode,
                    provider_label=invocation.provider_label,
                    provider_type=invocation.provider_type,
                    model=invocation.model,
                    input_tokens=invocation.input_tokens,
                    output_tokens=invocation.output_tokens,
                    last_error=None,
                )
            ),
        )

    def get_runtime_status(self) -> dict:
        return {
            **self.serialize_runtime_status(get_runtime_status()),
        }

    @staticmethod
    def serialize_runtime_status(status) -> dict:
        return {
            "connection_status": status.connection_status,
            "mode": status.mode,
            "provider_label": status.provider_label,
            "provider_type": status.provider_type,
            "model": status.model,
            "input_tokens": status.input_tokens,
            "output_tokens": status.output_tokens,
            "heartbeat_at": status.heartbeat_at,
            "last_error": status.last_error,
        }

    def _build_default_model_values(self) -> ModelRuntimeConfig:
        return ModelRuntimeConfig(
            provider_label=self._map_provider_label(self.app_settings.llm_provider),
            provider_type=self.app_settings.llm_provider if self.app_settings.llm_provider == "gemini" else "openai_compatible",
            model=self.app_settings.llm_model,
            base_url=self.app_settings.llm_base_url,
            api_key=self.app_settings.llm_api_key,
            timeout=self.app_settings.llm_timeout,
            temperature=self.app_settings.llm_temperature,
            use_mock_default=self.app_settings.llm_use_mock,
        )

    @staticmethod
    def _map_provider_label(provider: str) -> str:
        if provider in {"openai", "gemini", "qwen", "minimax", "kimi", "custom"}:
            return provider
        return "openai"

    @staticmethod
    def _runtime_config_is_complete(config: ModelRuntimeConfig) -> bool:
        if not config.model or not config.api_key:
            return False
        if config.provider_type == "openai_compatible" and not config.base_url:
            return False
        return True
