from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from threading import Lock


@dataclass
class LLMRuntimeStatus:
    connection_status: str = "idle"
    mode: str = "mock"
    provider_label: str = "openai"
    provider_type: str = "openai_compatible"
    model: str | None = None
    input_tokens: int = 0
    output_tokens: int = 0
    heartbeat_at: datetime | None = None
    last_error: str | None = None


_status = LLMRuntimeStatus()
_lock = Lock()


def get_runtime_status() -> LLMRuntimeStatus:
    with _lock:
        return LLMRuntimeStatus(**asdict(_status))


def update_runtime_status(**values) -> LLMRuntimeStatus:
    with _lock:
        for key, value in values.items():
            setattr(_status, key, value)
        if "heartbeat_at" not in values and values.get("connection_status") in {"connected", "mock"}:
            _status.heartbeat_at = datetime.now(timezone.utc)
        return LLMRuntimeStatus(**asdict(_status))
