import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from math import ceil

import httpx

from app.core.config import Settings


logger = logging.getLogger(__name__)


@dataclass
class ModelRuntimeConfig:
    provider_label: str
    provider_type: str
    model: str | None
    base_url: str | None
    api_key: str | None
    timeout: int
    temperature: float
    use_mock_default: bool = True


@dataclass
class ModelInvocationResult:
    text: str
    input_tokens: int
    output_tokens: int
    provider_label: str
    provider_type: str
    model: str | None
    mode: str


class BaseModelClient(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> ModelInvocationResult:
        raise NotImplementedError


class MockModelClient(BaseModelClient):
    def generate(self, prompt: str) -> ModelInvocationResult:
        logger.info("Mock model invoked with prompt length=%s", len(prompt))
        text = (
            "问题判断：你当前在推进一个科研工作流，需要把问题进一步收敛并形成可执行方案。\n"
            "下一步建议：\n"
            "1. 明确本轮研究目标和预期输出，避免问题定义过宽。\n"
            "2. 回顾已有资料和最近对话，补齐关键证据或实验条件。\n"
            "3. 将后续动作拆成可跟踪的小任务，并指定负责人或截止方式。\n"
            "建议任务：整理一份包含研究目标、关键证据、下一步实验动作的执行清单。"
        )
        return ModelInvocationResult(
            text=text,
            input_tokens=estimate_text_tokens(prompt),
            output_tokens=estimate_text_tokens(text),
            provider_label="mock",
            provider_type="mock",
            model="mock-llm",
            mode="mock",
        )


class OpenAICompatibleModelClient(BaseModelClient):
    def __init__(self, config: ModelRuntimeConfig) -> None:
        self.config = config

    def generate(self, prompt: str) -> ModelInvocationResult:
        if not self.config.api_key or not self.config.base_url or not self.config.model:
            raise ValueError("Live model is unavailable. Check backend LLM settings.")

        url = self.config.base_url.rstrip("/") + "/chat/completions"
        payload = {
            "model": self.config.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a research workflow copilot. Be concise, structured, and action oriented.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": self.config.temperature,
        }
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }

        try:
            with httpx.Client(timeout=self.config.timeout) as client:
                response = client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
        except Exception as exc:
            raise ValueError(format_model_error(exc, self.config)) from exc

        text = data["choices"][0]["message"]["content"]
        usage = data.get("usage") or {}
        return ModelInvocationResult(
            text=text,
            input_tokens=int(usage.get("prompt_tokens") or estimate_text_tokens(prompt)),
            output_tokens=int(usage.get("completion_tokens") or estimate_text_tokens(text)),
            provider_label=self.config.provider_label,
            provider_type=self.config.provider_type,
            model=self.config.model,
            mode="live",
        )


class GeminiModelClient(BaseModelClient):
    def __init__(self, config: ModelRuntimeConfig) -> None:
        self.config = config

    def generate(self, prompt: str) -> ModelInvocationResult:
        if not self.config.api_key or not self.config.model:
            raise ValueError("Gemini model is unavailable. Check backend LLM settings.")

        base_url = (self.config.base_url or "https://generativelanguage.googleapis.com").rstrip("/")
        url = (
            f"{base_url}/v1beta/models/{self.config.model}:generateContent"
            f"?key={self.config.api_key}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": self.config.temperature},
        }

        try:
            with httpx.Client(timeout=self.config.timeout) as client:
                response = client.post(url, json=payload, headers={"Content-Type": "application/json"})
                response.raise_for_status()
                data = response.json()
        except Exception as exc:
            raise ValueError(format_model_error(exc, self.config)) from exc

        candidates = data.get("candidates") or []
        if not candidates:
            raise ValueError("Gemini response did not contain candidates.")
        parts = candidates[0].get("content", {}).get("parts") or []
        text = "".join(part.get("text", "") for part in parts).strip()
        if not text:
            raise ValueError("Gemini response did not contain text.")
        usage = data.get("usageMetadata") or {}
        return ModelInvocationResult(
            text=text,
            input_tokens=int(usage.get("promptTokenCount") or estimate_text_tokens(prompt)),
            output_tokens=int(usage.get("candidatesTokenCount") or estimate_text_tokens(text)),
            provider_label=self.config.provider_label,
            provider_type=self.config.provider_type,
            model=self.config.model,
            mode="live",
        )


def runtime_config_from_settings(settings: Settings) -> ModelRuntimeConfig:
    provider_type = settings.llm_provider if settings.llm_provider == "gemini" else "openai_compatible"
    provider_label = settings.llm_provider if settings.llm_provider in {"openai", "gemini", "qwen", "minimax", "kimi", "custom"} else "openai"
    return ModelRuntimeConfig(
        provider_label=provider_label,
        provider_type=provider_type,
        model=settings.llm_model,
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key,
        timeout=settings.llm_timeout,
        temperature=settings.llm_temperature,
        use_mock_default=settings.llm_use_mock,
    )


def build_model_client(settings: Settings, force_mock: bool | None = None) -> BaseModelClient:
    return build_model_client_from_runtime_config(runtime_config_from_settings(settings), force_mock=force_mock)


def build_model_client_from_runtime_config(
    config: ModelRuntimeConfig,
    force_mock: bool | None = None,
) -> BaseModelClient:
    if force_mock is True:
        logger.info("Using MockModelClient because request forced mock mode")
        return MockModelClient()

    if force_mock is False:
        try:
            return _build_live_client(config)
        except Exception as exc:
            logger.warning("Live model requested but unavailable, falling back to mock: %s", exc)
            return MockModelClient()

    if config.use_mock_default:
        logger.info("Using MockModelClient because current runtime config defaults to mock")
        return MockModelClient()

    try:
        return _build_live_client(config)
    except Exception as exc:
        logger.warning("Default live model unavailable, falling back to mock: %s", exc)
        return MockModelClient()


def _build_live_client(config: ModelRuntimeConfig) -> BaseModelClient:
    if not config.api_key or not config.model:
        raise ValueError("Live model is unavailable. Check backend LLM settings.")
    if config.provider_type == "openai_compatible" and not config.base_url:
        raise ValueError("OpenAI-compatible model requires a base URL.")
    if config.provider_type == "gemini":
        return GeminiModelClient(config)
    return OpenAICompatibleModelClient(config)


def format_model_error(exc: Exception, config: ModelRuntimeConfig) -> str:
    provider_name = _provider_display_name(config.provider_label)

    if isinstance(exc, httpx.TimeoutException):
        return f"{provider_name} connection timed out. Check the endpoint and try again."

    if isinstance(exc, httpx.HTTPStatusError):
        status_code = exc.response.status_code
        if status_code == 401:
            return f"{provider_name} rejected the API key (HTTP 401). Check the key and try again."
        if status_code == 403:
            return f"{provider_name} denied access (HTTP 403). Check account permissions or model access."
        if status_code == 404:
            return f"{provider_name} endpoint or model was not found (HTTP 404). Check the base URL and model name."
        if status_code == 429:
            return f"{provider_name} rate limit or quota was exceeded (HTTP 429). Check billing, quota, or retry later."
        if 400 <= status_code < 500:
            return f"{provider_name} rejected the request (HTTP {status_code}). Check the model, base URL, and API key."
        if 500 <= status_code < 600:
            return f"{provider_name} is temporarily unavailable (HTTP {status_code}). Retry later."
        return f"{provider_name} request failed (HTTP {status_code})."

    if isinstance(exc, httpx.RequestError):
        return f"Unable to reach {provider_name}. Check the base URL and network connectivity."

    if str(exc):
        return str(exc)
    return f"{provider_name} request failed."


def _provider_display_name(provider_label: str) -> str:
    provider_map = {
        "openai": "OpenAI",
        "gemini": "Gemini",
        "qwen": "Qwen",
        "minimax": "MiniMax",
        "kimi": "Kimi",
        "custom": "the configured model provider",
    }
    return provider_map.get(provider_label, "the model provider")


def estimate_text_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, ceil(len(text) / 4))
