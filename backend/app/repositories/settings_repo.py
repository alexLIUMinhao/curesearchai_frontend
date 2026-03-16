from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_settings import UserSettings


class SettingsRepository:
    def get_by_user_id(self, db: Session, user_id: str) -> UserSettings | None:
        stmt = select(UserSettings).where(UserSettings.user_id == user_id)
        return db.scalar(stmt)

    def create(self, db: Session, settings: UserSettings) -> UserSettings:
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings

    def update(self, db: Session, settings: UserSettings, values: dict) -> UserSettings:
        for key, value in values.items():
            setattr(settings, key, value)
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings
