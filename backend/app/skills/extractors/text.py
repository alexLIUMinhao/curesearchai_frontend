from pathlib import Path


def extract_plain_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore").strip()
