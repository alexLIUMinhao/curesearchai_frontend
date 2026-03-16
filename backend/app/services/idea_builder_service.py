from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.models.chat_message import ChatMessage
from app.models.note import Note
from app.repositories.asset_repo import AssetRepository
from app.repositories.chat_repo import ChatRepository
from app.repositories.note_repo import NoteRepository
from app.schemas.idea_builder import IdeaBuilderStateRead
from app.services.workflow_service import WorkflowService
from app.skills.idea_builder.parser import dump_state_block, parse_state_block
from app.skills.idea_builder.skill import IdeaBuilderSkill
from app.utils.exceptions import AppException


@dataclass
class IdeaBuilderRuntimeState:
    phase: str = "idle"
    background: str = ""
    resources: str = ""
    familiarity: str = ""
    existing_idea: str = ""
    direction_choice: str | None = None
    refinement_turns: int = 0
    target_problem: str = ""
    planned_angle: str = ""
    next_step: str = ""
    task_generation_status: str = "not_requested"
    task_drafts: list[dict[str, Any]] | None = None
    maturity_score: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "phase": self.phase,
            "background": self.background,
            "resources": self.resources,
            "familiarity": self.familiarity,
            "existing_idea": self.existing_idea,
            "direction_choice": self.direction_choice,
            "refinement_turns": self.refinement_turns,
            "target_problem": self.target_problem,
            "planned_angle": self.planned_angle,
            "next_step": self.next_step,
            "task_generation_status": self.task_generation_status,
            "task_drafts": self.task_drafts or [],
            "maturity_score": self.maturity_score,
        }

    @classmethod
    def from_dict(cls, payload: dict[str, Any] | None) -> "IdeaBuilderRuntimeState":
        payload = payload or {}
        return cls(
            phase=payload.get("phase", "idle"),
            background=payload.get("background", ""),
            resources=payload.get("resources", ""),
            familiarity=payload.get("familiarity", ""),
            existing_idea=payload.get("existing_idea", ""),
            direction_choice=payload.get("direction_choice"),
            refinement_turns=int(payload.get("refinement_turns", 0) or 0),
            target_problem=payload.get("target_problem", ""),
            planned_angle=payload.get("planned_angle", ""),
            next_step=payload.get("next_step", ""),
            task_generation_status=payload.get("task_generation_status", "not_requested"),
            task_drafts=list(payload.get("task_drafts") or []),
            maturity_score=float(payload.get("maturity_score", 0.0) or 0.0),
        )


class IdeaBuilderService:
    def __init__(
        self,
        workflow_service: WorkflowService | None = None,
        asset_repo: AssetRepository | None = None,
        chat_repo: ChatRepository | None = None,
        note_repo: NoteRepository | None = None,
        skill: IdeaBuilderSkill | None = None,
    ) -> None:
        self.workflow_service = workflow_service or WorkflowService()
        self.asset_repo = asset_repo or AssetRepository()
        self.chat_repo = chat_repo or ChatRepository()
        self.note_repo = note_repo or NoteRepository()
        self.skill = skill or IdeaBuilderSkill()

    def start(self, db: Session, workflow_id: int, restart: bool = False) -> dict[str, Any]:
        workflow = self.workflow_service.get_workflow(db, workflow_id)
        structured_assets = self._get_structured_assets(db, workflow_id)
        if not structured_assets:
            raise AppException("Structure at least one source before starting idea building.", code=400)

        state_note = self._get_state_note(db, workflow_id)
        state = self._load_state_from_note(state_note)
        if state.phase not in {"idle", "completed"} and not restart:
            raise AppException("Idea Builder is already active.", code=400)

        state = IdeaBuilderRuntimeState(phase="background")
        self._upsert_state_note(db, workflow_id, state)
        memory_note = self._upsert_summary_note(db, workflow_id, workflow.name, state, structured_assets)
        assistant_message = self._create_assistant_message(
            db,
            workflow_id,
            self.skill.build_kickoff_message([item["name"] for item in structured_assets]),
        )
        return {
            "workflow_id": workflow_id,
            "phase": state.phase,
            "state": self._serialize_state(workflow_id, state, memory_note.id if memory_note else None),
            "user_message": None,
            "assistant_messages": [assistant_message],
            "task_drafts": [],
            "memory_note": memory_note,
        }

    def respond(
        self,
        db: Session,
        workflow_id: int,
        user_message: str | None = None,
        direction_choice: str | None = None,
        action: str | None = None,
    ) -> dict[str, Any]:
        workflow = self.workflow_service.get_workflow(db, workflow_id)
        structured_assets = self._get_structured_assets(db, workflow_id)
        if not structured_assets:
            raise AppException("Structure at least one source before starting idea building.", code=400)

        state_note = self._get_state_note(db, workflow_id)
        state = self._load_state_from_note(state_note)
        if state.phase in {"idle", "completed"} and action != "pause":
            raise AppException("Idea Builder is not active. Start it after structuring sources.", code=400)

        created_user_message = None
        assistant_messages = []
        task_drafts = state.task_drafts or []

        if action == "pause":
            created_user_message = self._create_user_message(db, workflow_id, "Pause Idea Builder.")
            state.phase = "idle"
            self._upsert_state_note(db, workflow_id, state)
            memory_note = self._upsert_summary_note(db, workflow_id, workflow.name, state, structured_assets)
            assistant_messages.append(
                self._create_assistant_message(
                    db,
                    workflow_id,
                    "Idea Builder has been paused. Regular chat is active again until you restart the idea flow.",
                )
            )
            return {
                "workflow_id": workflow_id,
                "phase": state.phase,
                "state": self._serialize_state(workflow_id, state, memory_note.id if memory_note else None),
                "user_message": created_user_message,
                "assistant_messages": assistant_messages,
                "task_drafts": task_drafts,
                "memory_note": memory_note,
            }

        if state.phase in {"background", "resources", "familiarity", "existing_idea"}:
            if not user_message or not user_message.strip():
                raise AppException("A response is required to continue the idea-building flow.", code=400)
            created_user_message = self._create_user_message(db, workflow_id, user_message.strip())
            self._record_question_response(state, state.phase, user_message.strip())

            if state.phase == "background":
                state.phase = "resources"
                assistant_messages.append(self._create_assistant_message(db, workflow_id, self.skill.build_question_message("resources")))
            elif state.phase == "resources":
                state.phase = "familiarity"
                assistant_messages.append(self._create_assistant_message(db, workflow_id, self.skill.build_question_message("familiarity")))
            elif state.phase == "familiarity":
                state.phase = "existing_idea"
                assistant_messages.append(self._create_assistant_message(db, workflow_id, self.skill.build_question_message("existing_idea")))
            else:
                state.phase = "direction_choice"
                assistant_messages.append(
                    self._create_assistant_message(
                        db,
                        workflow_id,
                        self.skill.build_deep_research_message(
                            workflow.stage,
                            structured_assets,
                            state.background,
                            state.resources,
                            state.familiarity,
                            state.existing_idea,
                        ),
                    )
                )
                assistant_messages.append(
                    self._create_assistant_message(db, workflow_id, self.skill.build_direction_options_message())
                )

        elif state.phase == "direction_choice":
            if direction_choice is None:
                raise AppException("Choose one idea direction to continue.", code=400)
            created_user_message = self._create_user_message(
                db,
                workflow_id,
                {
                    "migration": "I want to pursue the migration-style direction.",
                    "improvement": "I want to pursue the improvement-style direction.",
                    "gap": "I want to pursue the gap-seeking direction.",
                }[direction_choice],
            )
            state.direction_choice = direction_choice
            state.phase = "refinement"
            state.refinement_turns = 1
            self._seed_refinement_summary(state)
            assistant_messages.append(
                self._create_assistant_message(db, workflow_id, self.skill.build_refinement_message(direction_choice, state.refinement_turns))
            )

        elif state.phase == "refinement":
            if action == "keep_refining":
                created_user_message = self._create_user_message(db, workflow_id, "Let's keep refining the idea.")
                state.refinement_turns += 1
                assistant_messages.append(
                    self._create_assistant_message(
                        db,
                        workflow_id,
                        self.skill.build_refinement_message(state.direction_choice or "migration", state.refinement_turns),
                    )
                )
            elif not user_message or not user_message.strip():
                raise AppException("A refinement response is required.", code=400)
            else:
                created_user_message = self._create_user_message(db, workflow_id, user_message.strip())
                self._update_refinement_summary(state, user_message.strip())
                state.refinement_turns += 1
                state.maturity_score = self._compute_maturity(structured_assets, state)
                if state.maturity_score >= 0.8:
                    state.phase = "task_check"
                    assistant_messages.append(
                        self._create_assistant_message(
                            db,
                            workflow_id,
                            self.skill.build_task_generation_check_message(state.maturity_score),
                        )
                    )
                else:
                    assistant_messages.append(
                        self._create_assistant_message(
                            db,
                            workflow_id,
                            self.skill.build_refinement_message(state.direction_choice or "migration", state.refinement_turns),
                        )
                    )

        elif state.phase == "task_check":
            if action == "generate_tasks":
                created_user_message = self._create_user_message(db, workflow_id, "Generate tasks now.")
                task_drafts = state.task_drafts or self.skill.build_task_drafts(
                    state.direction_choice or "migration",
                    state.target_problem or state.existing_idea,
                    state.next_step or "Turn the strongest idea into the smallest next experiment.",
                )
                state.task_drafts = task_drafts
                state.task_generation_status = "drafted"
                state.phase = "completed"
                assistant_messages.append(
                    self._create_assistant_message(
                        db,
                        workflow_id,
                        self.skill.build_completion_message(state.direction_choice or "migration", len(task_drafts)),
                    )
                )
            elif action == "keep_refining":
                created_user_message = self._create_user_message(db, workflow_id, "Keep refining the idea.")
                state.phase = "refinement"
                state.refinement_turns += 1
                assistant_messages.append(
                    self._create_assistant_message(
                        db,
                        workflow_id,
                        self.skill.build_refinement_message(state.direction_choice or "migration", state.refinement_turns),
                    )
                )
            else:
                raise AppException("Choose whether to generate tasks or keep refining.", code=400)
        else:
            raise AppException("Idea Builder is not ready for more input.", code=400)

        state.maturity_score = self._compute_maturity(structured_assets, state)
        memory_note = self._upsert_summary_note(db, workflow_id, workflow.name, state, structured_assets)
        self._upsert_state_note(db, workflow_id, state)
        return {
            "workflow_id": workflow_id,
            "phase": state.phase,
            "state": self._serialize_state(workflow_id, state, memory_note.id if memory_note else None),
            "user_message": created_user_message,
            "assistant_messages": assistant_messages,
            "task_drafts": task_drafts,
            "memory_note": memory_note,
        }

    def get_state(self, db: Session, workflow_id: int) -> dict[str, Any]:
        workflow = self.workflow_service.get_workflow(db, workflow_id)
        state = self._load_state_from_note(self._get_state_note(db, workflow_id))
        memory_note = self._get_summary_note(db, workflow_id, workflow.name)
        structured_assets = self._get_structured_assets(db, workflow_id)
        state.maturity_score = self._compute_maturity(structured_assets, state)
        return self._serialize_state(workflow_id, state, memory_note.id if memory_note else None)

    def _create_user_message(self, db: Session, workflow_id: int, content: str):
        return self.chat_repo.create_message(
            db,
            ChatMessage(workflow_id=workflow_id, role="user", content=content),
        )

    def _create_assistant_message(self, db: Session, workflow_id: int, content: str):
        return self.chat_repo.create_message(
            db,
            ChatMessage(workflow_id=workflow_id, role="assistant", content=content),
        )

    def _get_structured_assets(self, db: Session, workflow_id: int) -> list[dict[str, Any]]:
        structured = []
        for asset in self.asset_repo.list(db, workflow_id=workflow_id):
            metadata = asset.metadata_json or {}
            result = (metadata.get("skills") or {}).get("asset_structurer")
            if result and result.get("status") == "completed":
                structured.append(
                    {
                        "id": asset.id,
                        "name": asset.name,
                        "summary": result.get("summary", ""),
                        "useful_claims": result.get("useful_claims", []),
                        "keywords": result.get("keywords", []),
                    }
                )
        return structured

    def _record_question_response(self, state: IdeaBuilderRuntimeState, phase: str, response: str) -> None:
        if phase == "background":
            state.background = response
        elif phase == "resources":
            state.resources = response
        elif phase == "familiarity":
            state.familiarity = response
        elif phase == "existing_idea":
            state.existing_idea = response
            state.target_problem = response

    def _seed_refinement_summary(self, state: IdeaBuilderRuntimeState) -> None:
        state.target_problem = state.target_problem or state.existing_idea or state.familiarity
        state.planned_angle = {
            "migration": "Transfer a mature method or baseline into a new setting.",
            "improvement": "Improve one weak link in the current baseline.",
            "gap": "Turn a failure mode or evaluation gap into a concrete research question.",
        }[state.direction_choice or "migration"]
        state.next_step = state.next_step or "Define the smallest experiment that would reduce uncertainty first."

    def _update_refinement_summary(self, state: IdeaBuilderRuntimeState, response: str) -> None:
        if not state.target_problem:
            state.target_problem = response
        elif not state.planned_angle:
            state.planned_angle = response
        else:
            state.next_step = response

    def _compute_maturity(self, structured_assets: list[dict[str, Any]], state: IdeaBuilderRuntimeState) -> float:
        score = 0.0
        if structured_assets:
            score += 0.2
        if all([state.background.strip(), state.resources.strip(), state.familiarity.strip(), state.existing_idea.strip()]):
            score += 0.3
        if state.direction_choice:
            score += 0.2
        if state.refinement_turns >= 1:
            score += 0.2
        if all([state.target_problem.strip(), state.planned_angle.strip(), state.next_step.strip()]):
            score += 0.1
        return min(score, 1.0)

    def _get_state_note(self, db: Session, workflow_id: int) -> Note | None:
        title = f"[system] Idea Builder State: {workflow_id}"
        return next((note for note in self.note_repo.list(db, workflow_id=workflow_id) if note.title == title), None)

    def _get_summary_note(self, db: Session, workflow_id: int, workflow_name: str) -> Note | None:
        title = f"Idea Builder: {workflow_name}"
        return next((note for note in self.note_repo.list(db, workflow_id=workflow_id) if note.title == title), None)

    def _load_state_from_note(self, note: Note | None) -> IdeaBuilderRuntimeState:
        if note is None:
            return IdeaBuilderRuntimeState()
        return IdeaBuilderRuntimeState.from_dict(parse_state_block(note.content))

    def _upsert_state_note(self, db: Session, workflow_id: int, state: IdeaBuilderRuntimeState) -> Note:
        title = f"[system] Idea Builder State: {workflow_id}"
        note = self._get_state_note(db, workflow_id)
        payload = dump_state_block(state.to_dict())
        if note is None:
            return self.note_repo.create(
                db,
                Note(workflow_id=workflow_id, title=title, content=payload, note_type="draft"),
            )
        return self.note_repo.update(db, note, {"content": payload, "note_type": "draft"})

    def _upsert_summary_note(
        self,
        db: Session,
        workflow_id: int,
        workflow_name: str,
        state: IdeaBuilderRuntimeState,
        structured_assets: list[dict[str, Any]],
    ) -> Note:
        title = f"Idea Builder: {workflow_name}"
        content = self._build_summary_note_content(workflow_id, state, structured_assets)
        note = self._get_summary_note(db, workflow_id, workflow_name)
        if note is None:
            return self.note_repo.create(
                db,
                Note(workflow_id=workflow_id, title=title, content=content, note_type="summary"),
            )
        return self.note_repo.update(db, note, {"content": content, "note_type": "summary"})

    def _build_summary_note_content(
        self,
        workflow_id: int,
        state: IdeaBuilderRuntimeState,
        structured_assets: list[dict[str, Any]],
    ) -> str:
        direction_map = {
            None: "Not selected yet",
            "migration": "迁移型",
            "improvement": "改进型",
            "gap": "挖坑型",
        }
        sections = [
            "Skill: idea_builder",
            f"Workflow ID: {workflow_id}",
            f"Structured sources count: {len(structured_assets)}",
            "",
            "Background summary:",
            state.background or "Not captured yet.",
            "",
            "Resources summary:",
            state.resources or "Not captured yet.",
            "",
            "Familiarity summary:",
            state.familiarity or "Not captured yet.",
            "",
            "Existing idea summary:",
            state.existing_idea or "Not captured yet.",
            "",
            "Chosen direction:",
            direction_map[state.direction_choice],
            "",
            "Current thesis / hypothesis:",
            state.target_problem or "Still being refined.",
            "",
            "Planned angle:",
            state.planned_angle or "Still being refined.",
            "",
            "Key risks:",
            "- The idea may still be too broad if it lacks a smallest next experiment.",
            "- Resource constraints still need to be reflected in execution scope.",
            "",
            "Recommended next step:",
            state.next_step or "Continue refinement until one smallest experiment is clear.",
            "",
            "Task generation status:",
            state.task_generation_status,
        ]
        return "\n".join(sections).strip()

    def _serialize_state(self, workflow_id: int, state: IdeaBuilderRuntimeState, memory_note_id: int | None) -> dict[str, Any]:
        return IdeaBuilderStateRead(
            workflow_id=workflow_id,
            phase=state.phase,
            maturity_score=state.maturity_score,
            direction_choice=state.direction_choice,
            can_generate_tasks=state.maturity_score >= 0.8 and state.phase in {"task_check", "completed"},
            memory_note_id=memory_note_id,
            task_generation_status=state.task_generation_status,
        ).model_dump()
