from typing import Any

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.repositories.asset_repo import AssetRepository
from app.schemas.asset import AssetRead
from app.services.workflow_service import WorkflowService
from app.storage.file_storage import LocalFileStorage


class AssetService:
    def __init__(
        self,
        asset_repo: AssetRepository | None = None,
        workflow_service: WorkflowService | None = None,
        file_storage: LocalFileStorage | None = None,
    ) -> None:
        self.asset_repo = asset_repo or AssetRepository()
        self.workflow_service = workflow_service or WorkflowService()
        self.file_storage = file_storage or LocalFileStorage()

    def upload_asset(
        self,
        db: Session,
        workflow_id: int,
        file: UploadFile,
        asset_type: str,
        name: str | None = None,
        metadata_json: dict[str, Any] | None = None,
    ) -> Asset:
        self.workflow_service.get_workflow(db, workflow_id)
        file_path = self.file_storage.save_upload(file)
        asset = Asset(
            workflow_id=workflow_id,
            name=name or file.filename or "uploaded-file",
            type=asset_type,
            file_path=file_path,
            metadata_json=metadata_json,
        )
        return self.asset_repo.create(db, asset)

    def list_assets(self, db: Session, workflow_id: int | None = None) -> list[Asset]:
        return self.asset_repo.list(db, workflow_id=workflow_id)

    def get_asset(self, db: Session, asset_id: int) -> Asset:
        asset = self.asset_repo.get_by_id(db, asset_id)
        if asset is None:
            from app.utils.exceptions import NotFoundException

            raise NotFoundException("asset not found")
        return asset

