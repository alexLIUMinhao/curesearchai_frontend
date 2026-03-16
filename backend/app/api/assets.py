import json

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.asset import AssetRead
from app.schemas.common import ApiEnvelope
from app.services.asset_service import AssetService
from app.utils.response import success_response


router = APIRouter(prefix="/assets", tags=["assets"])
asset_service = AssetService()


@router.post("/upload", response_model=ApiEnvelope[AssetRead], status_code=status.HTTP_201_CREATED)
def upload_asset(
    workflow_id: int = Form(...),
    type: str = Form(...),
    name: str | None = Form(default=None),
    metadata_json: str | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    metadata = json.loads(metadata_json) if metadata_json else None
    asset = asset_service.upload_asset(
        db=db,
        workflow_id=workflow_id,
        file=file,
        asset_type=type,
        name=name,
        metadata_json=metadata,
    )
    return success_response(AssetRead.model_validate(asset))


@router.get("", response_model=ApiEnvelope[list[AssetRead]])
def list_assets(workflow_id: int | None = None, db: Session = Depends(get_db)):
    assets = asset_service.list_assets(db, workflow_id=workflow_id)
    return success_response([AssetRead.model_validate(item) for item in assets])


@router.get("/{asset_id}", response_model=ApiEnvelope[AssetRead])
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = asset_service.get_asset(db, asset_id)
    return success_response(AssetRead.model_validate(asset))

