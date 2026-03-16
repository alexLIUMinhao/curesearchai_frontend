from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.chat import ChatMessageRead
from app.schemas.common import ApiEnvelope
from app.schemas.note import NoteRead
from app.schemas.skills import AssetSkillResultRead, AssetSkillRunResponse, RunAssetSkillRequest
from app.skills.service import SkillsService
from app.utils.response import success_response


router = APIRouter(prefix="/skills", tags=["skills"])
skills_service = SkillsService()


@router.post("/run-asset", response_model=ApiEnvelope[AssetSkillRunResponse], status_code=status.HTTP_201_CREATED)
def run_asset_skill(payload: RunAssetSkillRequest, db: Session = Depends(get_db)):
    result = skills_service.run_asset_skill(db, payload.asset_id, payload.skill_name)
    response = AssetSkillRunResponse(
        asset_id=result["asset_id"],
        skill_name=result["skill_name"],
        status=result["status"],
        result=result["result"],
        assistant_message=ChatMessageRead.model_validate(result["assistant_message"]) if result["assistant_message"] else None,
        memory_note=NoteRead.model_validate(result["memory_note"]) if result["memory_note"] else None,
    )
    return success_response(response)


@router.get("/asset/{asset_id}/{skill_name}", response_model=ApiEnvelope[AssetSkillResultRead])
def get_asset_skill_result(asset_id: int, skill_name: str, db: Session = Depends(get_db)):
    result = skills_service.get_asset_skill_result(db, asset_id, skill_name)
    return success_response(AssetSkillResultRead.model_validate(result))
