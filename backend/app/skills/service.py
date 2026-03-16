from pathlib import Path

from sqlalchemy.orm import Session

from app.models.chat_message import ChatMessage
from app.models.note import Note
from app.repositories.asset_repo import AssetRepository
from app.repositories.chat_repo import ChatRepository
from app.repositories.note_repo import NoteRepository
from app.services.asset_service import AssetService
from app.services.settings_service import SettingsService
from app.skills.asset_structurer.skill import AssetStructurerSkill
from app.skills.extractors.docx import extract_docx_text
from app.skills.extractors.pdf import extract_pdf_text
from app.skills.extractors.text import extract_plain_text
from app.skills.registry import get_skill
from app.skills.schemas import SkillContext, SkillRunResult
from app.utils.exceptions import AppException


class SkillsService:
    def __init__(
        self,
        asset_service: AssetService | None = None,
        asset_repo: AssetRepository | None = None,
        chat_repo: ChatRepository | None = None,
        note_repo: NoteRepository | None = None,
        settings_service: SettingsService | None = None,
    ) -> None:
        self.asset_service = asset_service or AssetService()
        self.asset_repo = asset_repo or AssetRepository()
        self.chat_repo = chat_repo or ChatRepository()
        self.note_repo = note_repo or NoteRepository()
        self.settings_service = settings_service or SettingsService()

    def run_asset_skill(self, db: Session, asset_id: int, skill_name: str) -> dict:
        asset = self.asset_service.get_asset(db, asset_id)
        file_path = self.asset_service.file_storage.get_file_path(asset.file_path)
        try:
            source_type = _resolve_source_type(file_path)
            text = self._extract_text(file_path, source_type)
        except AppException as exc:
            status = "unsupported" if "not supported" in exc.message.lower() else "failed"
            result = self._build_non_success_result(skill_name, status, file_path.suffix.lstrip(".") or "unknown", exc.message)
            asset = self._store_asset_result(db, asset, skill_name, result)
            return {
                "asset_id": asset.id,
                "skill_name": skill_name,
                "status": status,
                "result": result,
                "assistant_message": None,
                "memory_note": None,
            }
        if not text:
            result = self._build_non_success_result(skill_name, "failed", source_type, "The source content is empty.")
            asset = self._store_asset_result(db, asset, skill_name, result)
            return {
                "asset_id": asset.id,
                "skill_name": skill_name,
                "status": "failed",
                "result": result,
                "assistant_message": None,
                "memory_note": None,
            }

        runtime_config = self.settings_service.build_runtime_config(db)
        skill = get_skill(skill_name)
        if isinstance(skill, AssetStructurerSkill):
            try:
                run_result = skill.run_with_runtime(
                    SkillContext(asset=asset, extracted_text=text, source_type=source_type),
                    runtime_config,
                )
            except AppException as exc:
                result = self._build_non_success_result(skill_name, "failed", source_type, exc.message)
                self._store_asset_result(db, asset, skill_name, result)
                return {
                    "asset_id": asset.id,
                    "skill_name": skill_name,
                    "status": "failed",
                    "result": result,
                    "assistant_message": None,
                    "memory_note": None,
                }
        else:
            raise AppException("skill implementation is unavailable", code=400)

        asset = self._store_asset_result(db, asset, skill_name, run_result.payload)
        assistant_message = self.chat_repo.create_message(
            db,
            ChatMessage(
                workflow_id=asset.workflow_id,
                role="assistant",
                content=run_result.assistant_content or "",
            ),
        )
        note = self._upsert_memory_note(db, asset.workflow_id, asset.id, run_result)

        return {
            "asset_id": asset.id,
            "skill_name": skill_name,
            "status": run_result.status,
            "result": run_result.payload,
            "assistant_message": assistant_message,
            "memory_note": note,
        }

    def get_asset_skill_result(self, db: Session, asset_id: int, skill_name: str) -> dict:
        asset = self.asset_service.get_asset(db, asset_id)
        metadata = asset.metadata_json or {}
        skills = metadata.get("skills") or {}
        result = skills.get(skill_name)
        if result is None:
            raise AppException("skill result not found", code=404)
        return {
            "asset_id": asset.id,
            "skill_name": skill_name,
            "status": result.get("status", "unknown"),
            "result": result,
        }

    def _extract_text(self, path: Path, source_type: str) -> str:
        if source_type in {"txt", "md"}:
            return extract_plain_text(path)
        if source_type == "pdf":
            return extract_pdf_text(path)
        if source_type == "docx":
            return extract_docx_text(path)
        raise AppException("This source type is not supported by the current structuring skill.", code=400)

    def _store_asset_result(self, db: Session, asset, skill_name: str, result: dict):
        metadata = dict(asset.metadata_json or {})
        skills = dict(metadata.get("skills") or {})
        skills[skill_name] = result
        metadata["skills"] = skills
        return self.asset_repo.update(db, asset, {"metadata_json": metadata})

    def _upsert_memory_note(self, db: Session, workflow_id: int, asset_id: int, run_result: SkillRunResult):
        marker = f"Asset ID: {asset_id}"
        existing = next(
            (
                note
                for note in self.note_repo.list(db, workflow_id=workflow_id)
                if note.title == run_result.note_title and marker in note.content and "Skill: asset_structurer" in note.content
            ),
            None,
        )
        if existing is not None:
            return self.note_repo.update(
                db,
                existing,
                {
                    "content": run_result.note_content or existing.content,
                    "note_type": "summary",
                },
            )
        return self.note_repo.create(
            db,
            Note(
                workflow_id=workflow_id,
                title=run_result.note_title or "Structured Source",
                content=run_result.note_content or "",
                note_type="summary",
            ),
        )

    @staticmethod
    def _build_non_success_result(skill_name: str, status: str, source_type: str, message: str) -> dict:
        return {
            "skill_name": skill_name,
            "version": "v1",
            "status": status,
            "source_type": source_type,
            "summary": "",
            "research_problem": "",
            "method_overview": "",
            "key_contributions": [],
            "datasets_or_materials": [],
            "evaluation_or_results": [],
            "limitations_or_risks": [],
            "useful_claims": [],
            "suggested_followups": [],
            "keywords": [],
            "structured_at": None,
            "llm_mode": "unknown",
            "provider_label": "unknown",
            "model": None,
            "error": message,
        }


def _resolve_source_type(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".txt"}:
        return "txt"
    if suffix in {".md"}:
        return "md"
    if suffix in {".pdf"}:
        return "pdf"
    if suffix in {".docx"}:
        return "docx"
    raise AppException("This source type is not supported by the current structuring skill.", code=400)
