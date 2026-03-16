from datetime import datetime

from app.schemas.common import ORMModel


class LLMRuntimeStatusRead(ORMModel):
    connection_status: str
    mode: str
    provider_label: str
    provider_type: str
    model: str | None = None
    input_tokens: int = 0
    output_tokens: int = 0
    heartbeat_at: datetime | None = None
    last_error: str | None = None
