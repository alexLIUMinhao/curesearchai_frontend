import os
import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


TEST_DB_PATH = Path(__file__).resolve().parent / "test.db"
TEST_UPLOAD_DIR = Path(__file__).resolve().parent / "test_uploads"

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["UPLOAD_DIR"] = str(TEST_UPLOAD_DIR)

from app.core.db import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


engine = create_engine(
    os.environ["DATABASE_URL"],
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    if TEST_UPLOAD_DIR.exists():
        shutil.rmtree(TEST_UPLOAD_DIR)
    TEST_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    yield


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

