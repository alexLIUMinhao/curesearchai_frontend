from fastapi import APIRouter

from app.api.assets import router as assets_router
from app.api.chat import router as chat_router
from app.api.idea_builder import router as idea_builder_router
from app.api.notes import router as notes_router
from app.api.research_runs import router as research_runs_router
from app.api.settings import router as settings_router
from app.api.skills import router as skills_router
from app.api.tasks import router as tasks_router
from app.api.workflows import router as workflows_router


api_router = APIRouter(prefix="/api")
api_router.include_router(workflows_router)
api_router.include_router(assets_router)
api_router.include_router(research_runs_router)
api_router.include_router(chat_router)
api_router.include_router(idea_builder_router)
api_router.include_router(tasks_router)
api_router.include_router(notes_router)
api_router.include_router(settings_router)
api_router.include_router(skills_router)
