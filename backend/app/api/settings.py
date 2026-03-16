from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.common import ApiEnvelope
from app.schemas.llm_status import LLMRuntimeStatusRead
from app.schemas.settings import LLMProviderOptionRead, LLMTestRequest, LLMTestResponse, UserSettingsRead, UserSettingsUpdate
from app.services.settings_service import SettingsService
from app.utils.response import success_response


router = APIRouter(prefix="/settings", tags=["settings"])
settings_service = SettingsService()


@router.get("/me", response_model=ApiEnvelope[UserSettingsRead])
def get_my_settings(db: Session = Depends(get_db)):
    settings = settings_service.get_or_create_settings(db)
    return success_response(UserSettingsRead.model_validate(settings_service.serialize_settings(settings)))


@router.put("/me", response_model=ApiEnvelope[UserSettingsRead])
def update_my_settings(payload: UserSettingsUpdate, db: Session = Depends(get_db)):
    settings = settings_service.update_settings(db, payload)
    return success_response(UserSettingsRead.model_validate(settings_service.serialize_settings(settings)))


@router.get("/llm/providers", response_model=ApiEnvelope[list[LLMProviderOptionRead]])
def list_providers():
    return success_response(settings_service.list_provider_options())


@router.get("/llm/status", response_model=ApiEnvelope[LLMRuntimeStatusRead])
def get_llm_status():
    return success_response(LLMRuntimeStatusRead.model_validate(settings_service.get_runtime_status()))


@router.post("/llm/test", response_model=ApiEnvelope[LLMTestResponse])
def test_connection(payload: LLMTestRequest, db: Session = Depends(get_db)):
    result = settings_service.test_connection(payload, db=db)
    return success_response(result)
