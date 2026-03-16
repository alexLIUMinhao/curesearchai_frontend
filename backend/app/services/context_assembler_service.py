import re
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.workflow import Workflow
from app.repositories.asset_repo import AssetRepository
from app.repositories.chat_repo import ChatRepository
from app.repositories.note_repo import NoteRepository
from app.services.workflow_service import WorkflowService


@dataclass
class ContextSource:
    asset_id: int
    name: str
    summary: str
    method_overview: str
    key_contributions: list[str]
    useful_claims: list[str]
    keywords: list[str]
    score: float


class ContextAssemblerService:
    def __init__(
        self,
        workflow_service: WorkflowService | None = None,
        asset_repo: AssetRepository | None = None,
        chat_repo: ChatRepository | None = None,
        note_repo: NoteRepository | None = None,
    ) -> None:
        self.workflow_service = workflow_service or WorkflowService()
        self.asset_repo = asset_repo or AssetRepository()
        self.chat_repo = chat_repo or ChatRepository()
        self.note_repo = note_repo or NoteRepository()
        self.settings = get_settings()

    def build_context_pack(self, db: Session, workflow_id: int, user_message: str, top_k: int = 3) -> dict[str, Any]:
        workflow = self.workflow_service.get_workflow(db, workflow_id)
        history = self.chat_repo.list_by_workflow(db, workflow_id, limit=self.settings.chat_history_limit)
        sources = self._collect_and_rank_sources(db, workflow_id, user_message, top_k=top_k)
        notes_digest, memory_summary = self._build_notes_digest(db, workflow_id)
        return {
            "workflow": workflow,
            "history": history,
            "sources": sources,
            "memory_summary": memory_summary,
            "notes_digest": notes_digest,
        }

    def _collect_and_rank_sources(self, db: Session, workflow_id: int, user_message: str, top_k: int) -> list[ContextSource]:
        query_tokens = _tokenize(user_message)
        candidates: list[ContextSource] = []
        for asset in self.asset_repo.list(db, workflow_id=workflow_id):
            metadata = asset.metadata_json or {}
            structured = (metadata.get("skills") or {}).get("asset_structurer")
            if not structured or structured.get("status") != "completed":
                continue

            keywords = [str(item) for item in (structured.get("keywords") or [])]
            claims = [str(item) for item in (structured.get("useful_claims") or [])]
            summary = str(structured.get("summary") or "")
            method_overview = str(structured.get("method_overview") or "")
            contributions = [str(item) for item in (structured.get("key_contributions") or [])]

            score = self._score_source(
                query_tokens=query_tokens,
                source_name=asset.name,
                summary=summary,
                keywords=keywords,
                useful_claims=claims,
            )
            candidates.append(
                ContextSource(
                    asset_id=asset.id,
                    name=asset.name,
                    summary=summary,
                    method_overview=method_overview,
                    key_contributions=contributions,
                    useful_claims=claims,
                    keywords=keywords,
                    score=score,
                )
            )

        ranked = sorted(candidates, key=lambda item: item.score, reverse=True)
        return ranked[:top_k]

    @staticmethod
    def _score_source(
        query_tokens: set[str],
        source_name: str,
        summary: str,
        keywords: list[str],
        useful_claims: list[str],
    ) -> float:
        if not query_tokens:
            return 0.0
        name_tokens = _tokenize(source_name)
        summary_tokens = _tokenize(summary)
        keyword_tokens = _tokenize(" ".join(keywords))
        claim_tokens = _tokenize(" ".join(useful_claims))

        name_overlap = len(query_tokens & name_tokens)
        summary_overlap = len(query_tokens & summary_tokens)
        keyword_overlap = len(query_tokens & keyword_tokens)
        claim_overlap = len(query_tokens & claim_tokens)
        return name_overlap * 3.0 + summary_overlap * 2.0 + keyword_overlap * 1.5 + claim_overlap * 1.0

    def _build_notes_digest(self, db: Session, workflow_id: int) -> tuple[str, str]:
        notes = [
            note
            for note in self.note_repo.list(db, workflow_id=workflow_id)
            if not note.title.startswith("[system]")
        ]
        digest_lines: list[str] = []
        memory_summary = ""
        for note in notes[:5]:
            digest_lines.append(f"- {note.title}: {note.content[:180].replace(chr(10), ' ')}")
            if note.title.startswith("Conversation Memory:") and not memory_summary:
                memory_summary = note.content
            if note.title.startswith("Idea Builder:") and not memory_summary:
                memory_summary = note.content
        return "\n".join(digest_lines), memory_summary


def _tokenize(text: str) -> set[str]:
    tokens = re.findall(r"[A-Za-z0-9\u4e00-\u9fff]{2,}", text.lower())
    return set(tokens)
