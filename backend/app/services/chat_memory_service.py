from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.note import Note
from app.repositories.note_repo import NoteRepository
from app.services.workflow_service import WorkflowService


@dataclass
class ConversationMemory:
    background: str = ""
    resources: str = ""
    familiarity: str = ""
    current_question: str = ""
    current_hypothesis: str = ""
    constraints: str = ""
    last_actionable_next_step: str = ""


class ChatMemoryService:
    def __init__(
        self,
        note_repo: NoteRepository | None = None,
        workflow_service: WorkflowService | None = None,
    ) -> None:
        self.note_repo = note_repo or NoteRepository()
        self.workflow_service = workflow_service or WorkflowService()

    def upsert_memory(self, db: Session, workflow_id: int, user_message: str) -> Note:
        workflow = self.workflow_service.get_workflow(db, workflow_id)
        memory = self._load_existing_memory(db, workflow_id, workflow.name)
        self._merge_user_message(memory, user_message)
        title = f"Conversation Memory: {workflow.name}"
        content = self._dump_memory(memory)
        existing = self._get_memory_note(db, workflow_id, workflow.name)
        if existing is None:
            return self.note_repo.create(
                db,
                Note(
                    workflow_id=workflow_id,
                    title=title,
                    content=content,
                    note_type="summary",
                ),
            )
        return self.note_repo.update(
            db,
            existing,
            {
                "content": content,
                "note_type": "summary",
            },
        )

    def _get_memory_note(self, db: Session, workflow_id: int, workflow_name: str) -> Note | None:
        title = f"Conversation Memory: {workflow_name}"
        return next((note for note in self.note_repo.list(db, workflow_id=workflow_id) if note.title == title), None)

    def _load_existing_memory(self, db: Session, workflow_id: int, workflow_name: str) -> ConversationMemory:
        note = self._get_memory_note(db, workflow_id, workflow_name)
        if note is None:
            return ConversationMemory()
        return self._parse_memory(note.content)

    @staticmethod
    def _parse_memory(content: str) -> ConversationMemory:
        sections: dict[str, str] = {}
        current = None
        for raw_line in content.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            if line.endswith(":"):
                current = line[:-1]
                sections[current] = ""
                continue
            if current is not None:
                sections[current] = (sections[current] + " " + line).strip()
        return ConversationMemory(
            background=sections.get("Background", ""),
            resources=sections.get("Resources", ""),
            familiarity=sections.get("Familiarity", ""),
            current_question=sections.get("Current question", ""),
            current_hypothesis=sections.get("Current hypothesis", ""),
            constraints=sections.get("Constraints", ""),
            last_actionable_next_step=sections.get("Last actionable next step", ""),
        )

    @staticmethod
    def _merge_user_message(memory: ConversationMemory, message: str) -> None:
        normalized = message.strip()
        lower = normalized.lower()
        memory.current_question = normalized
        if any(token in lower for token in ["我", "i am", "my background", "背景", "研究方向"]):
            memory.background = normalized
        if any(token in lower for token in ["资源", "dataset", "code", "baseline", "gpu", "算力", "时间预算", "budget"]):
            memory.resources = normalized
        if any(token in lower for token in ["了解", "熟悉", "复现", "familiar", "reproduce", "know"]):
            memory.familiarity = normalized
        if any(token in lower for token in ["我认为", "假设", "hypothesis", "i think"]):
            memory.current_hypothesis = normalized
        if any(token in lower for token in ["限制", "constraint", "时间", "预算", "compute"]):
            memory.constraints = normalized
        if any(token in lower for token in ["下一步", "next step", "first action", "action item"]):
            memory.last_actionable_next_step = normalized

    @staticmethod
    def _dump_memory(memory: ConversationMemory) -> str:
        sections = [
            "Background:",
            memory.background or "Not captured yet.",
            "",
            "Resources:",
            memory.resources or "Not captured yet.",
            "",
            "Familiarity:",
            memory.familiarity or "Not captured yet.",
            "",
            "Current question:",
            memory.current_question or "Not captured yet.",
            "",
            "Current hypothesis:",
            memory.current_hypothesis or "Not captured yet.",
            "",
            "Constraints:",
            memory.constraints or "Not captured yet.",
            "",
            "Last actionable next step:",
            memory.last_actionable_next_step or "Not captured yet.",
        ]
        return "\n".join(sections).strip()
