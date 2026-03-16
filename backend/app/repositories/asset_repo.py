from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.asset import Asset


class AssetRepository:
    def create(self, db: Session, asset: Asset) -> Asset:
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset

    def get_by_id(self, db: Session, asset_id: int) -> Asset | None:
        return db.get(Asset, asset_id)

    def list(self, db: Session, workflow_id: int | None = None) -> list[Asset]:
        stmt = select(Asset).order_by(Asset.created_at.desc())
        if workflow_id is not None:
            stmt = stmt.where(Asset.workflow_id == workflow_id)
        return list(db.scalars(stmt))

    def update(self, db: Session, asset: Asset, values: dict) -> Asset:
        for key, value in values.items():
            setattr(asset, key, value)
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset
