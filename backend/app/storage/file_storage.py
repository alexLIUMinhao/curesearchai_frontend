from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import get_settings


class LocalFileStorage:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_dir = Path(self.settings.upload_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_upload(self, file: UploadFile) -> str:
        suffix = Path(file.filename or "").suffix
        safe_name = f"{uuid4().hex}{suffix}"
        target_path = self.base_dir / safe_name
        with target_path.open("wb") as buffer:
            while chunk := file.file.read(1024 * 1024):
                buffer.write(chunk)
        return str(target_path.relative_to(self.base_dir.parent))

    def get_file_path(self, relative_path: str) -> Path:
        return self.base_dir.parent / relative_path

